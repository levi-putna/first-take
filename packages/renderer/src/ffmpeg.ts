import fs from "node:fs";
import path from "node:path";
import { execa } from "execa";
import type { AudioClipDescriptor } from "@levi-putna/storyboard-media";
import type { VideoManifest } from "@levi-putna/storyboard-schema";
import { resolveAssetPath } from "@levi-putna/storyboard-schema";
import { emitWarn } from "./progress.js";
import { volumeFilterFromEnvelope } from "./volume-envelope.js";
import { getFfmpegPath, getFfprobePath } from "./binaries.js";

/**
 * Check that ffmpeg and ffprobe can run (packaged binaries by default).
 */
export async function assertFfmpeg({
  ffmpegPath,
  ffprobePath,
}: {
  ffmpegPath?: string;
  ffprobePath?: string;
} = {}): Promise<void> {
  const ffmpeg = getFfmpegPath({ ffmpegPath });
  const ffprobe = getFfprobePath({ ffprobePath });
  try {
    await execa(ffmpeg, ["-version"]);
    await execa(ffprobe, ["-version"]);
  } catch {
    throw new Error(
      `ffmpeg/ffprobe not found (tried ${ffmpeg} and ${ffprobe}). Reinstall first-take so the bundled binaries download, or set STORYBOARD_FFMPEG and STORYBOARD_FFPROBE.`,
    );
  }
}

/**
 * Run ffmpeg with quiet defaults, or inherit the terminal when verbose.
 */
async function runFfmpeg({
  args,
  verbose = false,
  ffmpegPath,
}: {
  args: string[];
  verbose?: boolean;
  ffmpegPath?: string;
}): Promise<void> {
  const quietArgs = verbose
    ? args
    : ["-hide_banner", "-loglevel", "error", ...args];
  const binary = getFfmpegPath({ ffmpegPath });

  try {
    await execa(binary, quietArgs, {
      stdio: verbose ? "inherit" : "pipe",
    });
  } catch (err) {
    if (verbose) throw err;
    const failure = err as { stderr?: string; message?: string };
    const stderr =
      typeof failure.stderr === "string" && failure.stderr.trim()
        ? failure.stderr.trim()
        : failure.message ?? String(err);
    throw new Error(`ffmpeg failed:\n${stderr}`);
  }
}

/**
 * Encode a JPEG/PNG frame sequence (and optional audio) to H.264 MP4.
 */
export async function stitchFramesToVideo({
  framesDir,
  imagePattern,
  fps,
  outputPath,
  audioClips,
  manifest,
  manifestPath,
  durationInFrames,
  silent = false,
  verbose = false,
  ffmpegPath,
  ffprobePath,
  onWarn,
}: {
  framesDir: string;
  /** e.g. frame-%06d.jpg */
  imagePattern: string;
  fps: number;
  outputPath: string;
  audioClips: AudioClipDescriptor[];
  manifest: VideoManifest;
  manifestPath: string;
  durationInFrames: number;
  silent?: boolean;
  verbose?: boolean;
  ffmpegPath?: string;
  ffprobePath?: string;
  onWarn?: (message: string) => void;
}): Promise<void> {
  await assertFfmpeg({ ffmpegPath, ffprobePath });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const durationSec = durationInFrames / fps;
  const args: string[] = [
    "-y",
    "-framerate",
    String(fps),
    "-i",
    path.join(framesDir, imagePattern),
  ];

  const assetsRoot = manifest.assetsRoot ?? ".";
  const resolvedClips: Array<{
    clip: AudioClipDescriptor;
    abs: string;
  }> = [];

  if (!silent) {
    for (const clip of audioClips) {
      // staticFile paths start with / — strip and resolve against assetsRoot
      const rel = clip.src.replace(/^\//, "");
      const abs = resolveAssetPath({
        manifestPath,
        assetsRoot,
        relativePath: rel,
      });
      if (!fs.existsSync(abs)) {
        emitWarn({ onWarn, message: `Skipping missing audio: ${abs}` });
        continue;
      }
      // Skip video files (or other inputs) that have no audio stream
      try {
        const probe = await execa(getFfprobePath({ ffprobePath }), [
          "-v",
          "error",
          "-select_streams",
          "a:0",
          "-show_entries",
          "stream=codec_type",
          "-of",
          "csv=p=0",
          abs,
        ]);
        if (!probe.stdout.trim()) {
          emitWarn({
            onWarn,
            message: `Skipping input with no audio stream: ${abs}`,
          });
          continue;
        }
      } catch {
        emitWarn({
          onWarn,
          message: `Skipping unreadable audio input: ${abs}`,
        });
        continue;
      }
      resolvedClips.push({ clip, abs });
      args.push("-i", abs);
    }
  }

  if (resolvedClips.length === 0) {
    args.push(
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "18",
      "-t",
      String(durationSec),
      "-an",
      outputPath,
    );
    await runFfmpeg({ args, verbose, ffmpegPath });
    return;
  }

  // Build filter_complex: delay each clip, apply volume envelope, amix
  const filters: string[] = [];
  const mixInputs: string[] = [];

  resolvedClips.forEach(({ clip }, index) => {
    const inputIndex = index + 1; // 0 is video
    const delayMs = Math.round((clip.startFromFrame / fps) * 1000);
    const label = `a${index}`;
    const volumeFilter = volumeFilterFromEnvelope({
      volumePerFrame: clip.volumePerFrame,
      fps,
    });

    let chain = `[${inputIndex}:a]`;
    // Trim into the source file first (used by <Video> embedded audio)
    if (
      clip.mediaStartSeconds !== undefined ||
      clip.mediaEndSeconds !== undefined
    ) {
      const start = clip.mediaStartSeconds ?? 0;
      const end = clip.mediaEndSeconds ?? start + durationSec;
      chain += `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,`;
    }
    if (clip.loop) {
      chain += `aloop=loop=-1:size=2e+09,`;
    }
    if (delayMs > 0) {
      chain += `adelay=${delayMs}|${delayMs},`;
    }
    // Envelope is composition-relative (`t` after adelay)
    chain += `${volumeFilter},`;
    // Hard-stop after the clip window (mid-clip volume=0 still plays through)
    if (clip.durationInFrames !== undefined) {
      const clipEndSec =
        (clip.startFromFrame + clip.durationInFrames) / fps;
      chain += `atrim=0:${clipEndSec.toFixed(6)},`;
    }
    // Pad / trim so the mix always spans the full composition
    chain += `apad,atrim=0:${durationSec},asetpts=PTS-STARTPTS[${label}]`;
    filters.push(chain);
    mixInputs.push(`[${label}]`);
  });

  if (resolvedClips.length === 1) {
    // Skip amix for a single clip — map the filtered label directly
    args.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "0:v",
      "-map",
      "[a0]",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "18",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-t",
      String(durationSec),
      outputPath,
    );
    await runFfmpeg({ args, verbose, ffmpegPath });
    return;
  }

  const mix = `${mixInputs.join("")}amix=inputs=${resolvedClips.length}:duration=first:dropout_transition=0:normalize=0[aout]`;
  filters.push(mix);

  args.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    String(durationSec),
    outputPath,
  );

  await runFfmpeg({ args, verbose, ffmpegPath });
}
