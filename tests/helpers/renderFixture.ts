import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateVideoFile,
  totalDurationInFrames,
} from "@levi-putna/storyboard-schema";
import { renderMedia, renderStill } from "@levi-putna/storyboard-renderer";
import {
  fixtureManifestPath,
  goldenStillPath,
  loadExpectations,
  type FixtureExpectations,
} from "./expectations.js";
import { comparePngFiles } from "./pixelDiff.js";
import {
  assertDurationClose,
  audioStream,
  ffprobeJson,
  videoStream,
} from "./ffprobe.js";

const helpersDir = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(helpersDir, "../..");

/**
 * Whether golden PNGs should be rewritten instead of compared.
 */
export function shouldUpdateGoldens(): boolean {
  return (
    process.env.UPDATE_GOLDENS === "1" ||
    process.env.UPDATE_GOLDENS === "true"
  );
}

/**
 * Validate and return manifest for a fixture directory.
 */
export function loadValidatedManifest({
  fixtureDir,
}: {
  fixtureDir: string;
}) {
  const manifestPath = fixtureManifestPath({ fixtureDir });
  const result = validateVideoFile({ manifestPath });
  if (!result.ok) {
    throw new Error(
      `Invalid fixture ${fixtureDir}:\n${result.errors.join("\n")}`,
    );
  }
  return { manifest: result.manifest, manifestPath };
}

/**
 * Render a still for a fixture frame (and optionally compare to golden).
 */
export async function renderAndAssertStill({
  fixtureDir,
  fixtureName,
  frame,
  formatId,
  updateGoldens = shouldUpdateGoldens(),
}: {
  fixtureDir: string;
  fixtureName: string;
  frame: number;
  formatId: string;
  updateGoldens?: boolean;
}): Promise<void> {
  const { manifest, manifestPath } = loadValidatedManifest({ fixtureDir });
  const goldenPath = goldenStillPath({ fixtureDir, formatId, frame });
  const workOut = path.join(
    REPO_ROOT,
    "out",
    "test-stills",
    fixtureName,
    `still-frame-${formatId}-${frame}.png`,
  );
  fs.mkdirSync(path.dirname(workOut), { recursive: true });

  await renderStill({
    manifest,
    manifestPath,
    formatId,
    frame,
    outputPath: workOut,
  });

  if (updateGoldens) {
    fs.mkdirSync(path.dirname(goldenPath), { recursive: true });
    fs.copyFileSync(workOut, goldenPath);
    return;
  }

  if (!fs.existsSync(goldenPath)) {
    throw new Error(
      `Missing golden ${goldenPath}. Run pnpm test:update-goldens first.`,
    );
  }

  const diffOutputPath = path.join(
    REPO_ROOT,
    "out",
    "test-diffs",
    `${fixtureName}-frame-${frame}-diff.png`,
  );
  const result = comparePngFiles({
    actualPath: workOut,
    expectedPath: goldenPath,
    diffOutputPath,
  });

  if (!result.passed) {
    throw new Error(
      `Golden mismatch ${fixtureName} frame ${frame}: ${result.diffPixels}/${result.totalPixels} pixels differ (${result.percentDiffering.toFixed(3)}%). Diff: ${diffOutputPath}`,
    );
  }
}

/**
 * Render all golden stills listed in expectations.json.
 */
export async function assertFixtureStills({
  fixtureDir,
  fixtureName,
  expectations,
}: {
  fixtureDir: string;
  fixtureName: string;
  expectations?: FixtureExpectations;
}): Promise<void> {
  const exp = expectations ?? loadExpectations({ fixtureDir });
  // Primary format goldens always; additional formats get frame 0 for size checks
  const primary = exp.formats[0];
  for (const frame of exp.stills) {
    await renderAndAssertStill({
      fixtureDir,
      fixtureName,
      frame,
      formatId: primary,
    });
  }
  for (const formatId of exp.formats.slice(1)) {
    await renderAndAssertStill({
      fixtureDir,
      fixtureName,
      frame: exp.stills[0] ?? 0,
      formatId,
    });
  }
}

/**
 * Render an MP4 for a fixture format and assert ffprobe metadata.
 */
export async function renderAndAssertMedia({
  fixtureDir,
  fixtureName,
  formatId,
  expectations,
  silent,
}: {
  fixtureDir: string;
  fixtureName: string;
  formatId: string;
  expectations?: FixtureExpectations;
  silent?: boolean;
}): Promise<{ outputPath: string }> {
  const exp = expectations ?? loadExpectations({ fixtureDir });
  const { manifest, manifestPath } = loadValidatedManifest({ fixtureDir });
  const useSilent = silent ?? exp.silent ?? false;
  const outputPath = path.join(
    REPO_ROOT,
    "out",
    "test-renders",
    `${fixtureName}-${formatId}.mp4`,
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await renderMedia({
    manifest,
    manifestPath,
    formatId,
    outputPath,
    concurrency: 1,
    silent: useSilent,
  });

  const probe = await ffprobeJson({ filePath: outputPath });
  const video = videoStream({ probe });
  if (!video) throw new Error(`No video stream in ${outputPath}`);
  if (video.codec_name !== "h264") {
    throw new Error(`Expected h264, got ${video.codec_name}`);
  }

  const format = manifest.formats.find((f) => f.id === formatId);
  if (!format) throw new Error(`Unknown format ${formatId}`);
  if (video.width !== format.width || video.height !== format.height) {
    throw new Error(
      `Size mismatch: got ${video.width}x${video.height}, expected ${format.width}x${format.height}`,
    );
  }

  const durationFrames = totalDurationInFrames(manifest);
  const actualDuration = parseFloat(probe.format.duration ?? "0");
  assertDurationClose({
    actualSeconds: actualDuration,
    expectedFrames: durationFrames,
    fps: manifest.fps,
  });

  if (video.nb_frames) {
    const frames = parseInt(video.nb_frames, 10);
    if (Math.abs(frames - durationFrames) > 1) {
      throw new Error(
        `Frame count ${frames} differs from expected ${durationFrames}`,
      );
    }
  }

  const audio = audioStream({ probe });
  if (useSilent) {
    if (audio) {
      throw new Error(`Expected no audio stream for silent render, got ${audio.codec_name}`);
    }
  } else if (!useSilent) {
    if (!audio || audio.codec_name !== "aac") {
      throw new Error(
        `Expected AAC audio, got ${audio?.codec_name ?? "(none)"}`,
      );
    }
  }

  return { outputPath };
}
