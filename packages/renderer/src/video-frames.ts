import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execa } from "execa";
import type { VideoClipDescriptor } from "@storyboard/media";
import { videoClipCacheKey, videoClipDurationInFrames } from "@storyboard/media";

export type ExtractedVideoFrames = {
  cacheKey: string;
  basePath: string;
  absoluteDir: string;
  frameCount: number;
};

/**
 * Resolve a browser `/assets/...` src to an absolute file under the serve root.
 */
export function resolveServedAssetPath({
  serveDir,
  src,
}: {
  serveDir: string;
  src: string;
}): string {
  const cleaned = src.replace(/^\//, "");
  return path.join(serveDir, cleaned);
}

/**
 * Pre-extract composition-fps JPEG frames for a trimmed video clip (OffthreadVideo-style).
 * One FFmpeg pass per unique trim window — far faster than seeking per screenshot.
 */
export async function extractVideoClipFrames({
  clip,
  fps,
  serveDir,
  workDir,
}: {
  clip: VideoClipDescriptor;
  fps: number;
  serveDir: string;
  workDir: string;
}): Promise<ExtractedVideoFrames> {
  const cacheKey = videoClipCacheKey({
    src: clip.src,
    startFromSeconds: clip.startFromSeconds,
    endAtSeconds: clip.endAtSeconds,
    fps,
    playbackRate: clip.playbackRate,
  });

  const hash = createHash("sha1").update(cacheKey).digest("hex").slice(0, 16);
  const absoluteDir = path.join(workDir, "video-frames", hash);
  const basePath = `/__video_frames/${hash}`;
  const publicDir = path.join(serveDir, "__video_frames", hash);

  const frameCount = videoClipDurationInFrames({
    startFromSeconds: clip.startFromSeconds,
    endAtSeconds: clip.endAtSeconds,
    fps,
    playbackRate: clip.playbackRate,
  });

  if (
    fs.existsSync(path.join(publicDir, `frame-${String(0).padStart(6, "0")}.jpg`)) &&
    fs.existsSync(
      path.join(publicDir, `frame-${String(frameCount - 1).padStart(6, "0")}.jpg`),
    )
  ) {
    return { cacheKey, basePath, absoluteDir: publicDir, frameCount };
  }

  fs.mkdirSync(absoluteDir, { recursive: true });
  fs.mkdirSync(path.dirname(publicDir), { recursive: true });

  const inputPath = resolveServedAssetPath({ serveDir, src: clip.src });
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Video source not found: ${inputPath} (src=${clip.src})`);
  }

  const outputPattern = path.join(absoluteDir, "frame-%06d.jpg");
  const args = ["-y"];

  // Accurate seek into the source before decoding
  if (clip.startFromSeconds > 0) {
    args.push("-ss", String(clip.startFromSeconds));
  }
  args.push("-i", inputPath);
  if (clip.endAtSeconds !== undefined) {
    const duration = Math.max(0, clip.endAtSeconds - clip.startFromSeconds);
    args.push("-t", String(duration / clip.playbackRate));
  }

  // Match composition fps so localFrame maps 1:1 onto extracted stills
  const vf =
    clip.playbackRate === 1
      ? `fps=${fps}`
      : `setpts=PTS/${clip.playbackRate},fps=${fps}`;

  args.push(
    "-vf",
    vf,
    "-q:v",
    "2",
    "-frames:v",
    String(frameCount),
    outputPattern,
  );

  await execa("ffmpeg", args, { stdio: "pipe" });

  // FFmpeg %06d is 1-based by default — rename to 0-based for localFrame indexing
  const written = fs
    .readdirSync(absoluteDir)
    .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg"))
    .sort();

  if (written.length === 0) {
    throw new Error(`FFmpeg produced no frames for ${clip.src}`);
  }

  const tmpDir = path.join(absoluteDir, "_zero");
  fs.mkdirSync(tmpDir, { recursive: true });
  written.forEach((file, index) => {
    fs.renameSync(
      path.join(absoluteDir, file),
      path.join(tmpDir, `frame-${String(index).padStart(6, "0")}.jpg`),
    );
  });
  for (const file of fs.readdirSync(tmpDir)) {
    fs.renameSync(path.join(tmpDir, file), path.join(absoluteDir, file));
  }
  fs.rmdirSync(tmpDir);

  // Mirror into the HTTP-served directory
  if (publicDir !== absoluteDir) {
    fs.cpSync(absoluteDir, publicDir, { recursive: true });
  }

  const actualCount = fs
    .readdirSync(publicDir)
    .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg")).length;

  return {
    cacheKey,
    basePath,
    absoluteDir: publicDir,
    frameCount: actualCount,
  };
}

/**
 * Extract frames for every unique video clip and return a browser frame map.
 */
export async function extractAllVideoClips({
  clips,
  fps,
  serveDir,
  workDir,
}: {
  clips: VideoClipDescriptor[];
  fps: number;
  serveDir: string;
  workDir: string;
}): Promise<Record<string, { basePath: string; frameCount: number }>> {
  const unique = new Map<string, VideoClipDescriptor>();
  for (const clip of clips) {
    const key = videoClipCacheKey({
      src: clip.src,
      startFromSeconds: clip.startFromSeconds,
      endAtSeconds: clip.endAtSeconds,
      fps,
      playbackRate: clip.playbackRate,
    });
    if (!unique.has(key)) unique.set(key, clip);
  }

  const map: Record<string, { basePath: string; frameCount: number }> = {};
  for (const clip of unique.values()) {
    const extracted = await extractVideoClipFrames({
      clip,
      fps,
      serveDir,
      workDir,
    });
    map[extracted.cacheKey] = {
      basePath: extracted.basePath,
      frameCount: extracted.frameCount,
    };
  }
  return map;
}
