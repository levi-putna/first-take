import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { VideoManifest } from "@storyboard/schema";
import { totalDurationInFrames } from "@storyboard/schema";
import { bundleComposition } from "./bundle.js";
import { captureFrames, captureStill } from "./capture.js";
import { stitchFramesToVideo, assertFfmpeg } from "./ffmpeg.js";
import { serveDirectory } from "./serve.js";
import {
  emitProgress,
  emitWarn,
  type RenderObservers,
} from "./progress.js";

export type RenderOptions = {
  manifest: VideoManifest;
  manifestPath: string;
  formatId: string;
  outputPath: string;
  concurrency?: number;
  keepFrames?: boolean;
  /** Encode without audio (mute). Not the same as quiet logging. */
  silent?: boolean;
  chromiumPath?: string;
  workDir?: string;
} & RenderObservers;

/**
 * Full pipeline: bundle → serve → capture frames → FFmpeg encode.
 */
export async function renderMedia({
  manifest,
  manifestPath,
  formatId,
  outputPath,
  concurrency,
  keepFrames = false,
  silent = false,
  chromiumPath,
  workDir,
  verbose = false,
  onProgress,
  onWarn,
}: RenderOptions): Promise<{ outputPath: string }> {
  await assertFfmpeg();

  const root =
    workDir ?? fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-render-"));
  const bundleRoot = path.join(root, "bundle");
  const framesDir = path.join(root, "frames");

  try {
    emitProgress({
      onProgress,
      event: { phase: "bundling", message: "Bundling composition" },
    });
    const { outDir } = await bundleComposition({
      manifest,
      manifestPath,
      formatId,
      outDir: bundleRoot,
    });

    const server = await serveDirectory({ dir: outDir });
    try {
      const capture = await captureFrames({
        serveUrl: server.url,
        serveDir: outDir,
        workDir: root,
        manifest,
        formatId,
        framesDir,
        concurrency,
        chromiumPath,
        imageFormat: "jpeg",
        onProgress,
      });

      const durationInFrames = totalDurationInFrames(manifest);
      emitProgress({
        onProgress,
        event: { phase: "encoding", message: "Encoding MP4" },
      });
      await stitchFramesToVideo({
        framesDir: capture.framesDir,
        imagePattern: "frame-%06d.jpg",
        fps: manifest.fps,
        outputPath,
        audioClips: capture.audioClips,
        manifest,
        manifestPath,
        durationInFrames,
        silent,
        verbose,
        onWarn,
      });

      emitProgress({
        onProgress,
        event: { phase: "done", message: "Render complete" },
      });

      return { outputPath };
    } finally {
      await server.close();
    }
  } finally {
    if (!keepFrames) {
      fs.rmSync(root, { recursive: true, force: true });
    } else {
      emitWarn({ onWarn, message: `Kept work dir: ${root}` });
    }
  }
}

export type StillOptions = {
  manifest: VideoManifest;
  manifestPath: string;
  formatId: string;
  frame: number;
  outputPath: string;
  chromiumPath?: string;
} & RenderObservers;

/**
 * Render a single still PNG.
 */
export async function renderStill({
  manifest,
  manifestPath,
  formatId,
  frame,
  outputPath,
  chromiumPath,
  verbose = false,
  onProgress,
  onWarn,
}: StillOptions): Promise<void> {
  void verbose;
  void onWarn;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-still-bundle-"));
  try {
    emitProgress({
      onProgress,
      event: { phase: "bundling", message: "Bundling composition" },
    });
    const { outDir } = await bundleComposition({
      manifest,
      manifestPath,
      formatId,
      outDir: root,
    });
    const server = await serveDirectory({ dir: outDir });
    try {
      emitProgress({
        onProgress,
        event: {
          phase: "capturing",
          message: `Capturing still frame ${frame}`,
          current: 0,
          total: 1,
        },
      });
      await captureStill({
        serveUrl: server.url,
        serveDir: outDir,
        workDir: root,
        manifest,
        formatId,
        frame,
        outPath: outputPath,
        chromiumPath,
      });
      emitProgress({
        onProgress,
        event: {
          phase: "capturing",
          message: `Captured still frame ${frame}`,
          current: 1,
          total: 1,
        },
      });
      emitProgress({
        onProgress,
        event: { phase: "done", message: "Still complete" },
      });
    } finally {
      await server.close();
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

export { bundleComposition } from "./bundle.js";
export { captureFrames, captureStill } from "./capture.js";
export { stitchFramesToVideo, assertFfmpeg } from "./ffmpeg.js";
export { serveDirectory } from "./serve.js";
export { collectComponentPaths } from "@storyboard/schema";
export type {
  RenderObservers,
  RenderPhase,
  RenderProgressEvent,
} from "./progress.js";
