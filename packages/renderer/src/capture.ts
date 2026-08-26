import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import type { VideoManifest } from "@levi-putna/storyboard-schema";
import { scenePlacements, totalDurationInFrames } from "@levi-putna/storyboard-schema";
import type { AudioClipDescriptor, VideoClipDescriptor } from "@levi-putna/storyboard-media";
import { prepareFramesDir } from "./serve.js";
import { extractAllVideoClips } from "./video-frames.js";
import type { StoryboardWindow } from "./types.js";
import { emitProgress, type RenderProgressEvent } from "./progress.js";

export type CaptureOptions = {
  serveUrl: string;
  /** Absolute path to the directory being served (bundle dist). */
  serveDir: string;
  /** Scratch directory for extracted video frames. */
  workDir?: string;
  manifest: VideoManifest;
  formatId: string;
  framesDir: string;
  concurrency?: number;
  frameStart?: number;
  frameEnd?: number;
  imageFormat?: "jpeg" | "png";
  jpegQuality?: number;
  chromiumPath?: string;
  ffmpegPath?: string;
  keepBrowserOpen?: boolean;
  onProgress?: (event: RenderProgressEvent) => void;
};

export type CaptureResult = {
  framesDir: string;
  frameCount: number;
  width: number;
  height: number;
  fps: number;
  audioClips: AudioClipDescriptor[];
};

async function waitReady(page: Page, timeoutMs = 15_000): Promise<void> {
  await page.waitForFunction(
    () => Boolean((window as unknown as StoryboardWindow).__STORYBOARD__),
    undefined,
    { timeout: timeoutMs },
  );
  await page.evaluate(async (timeout) => {
    await (window as unknown as StoryboardWindow).__STORYBOARD__!.waitForReady(
      timeout,
    );
  }, timeoutMs);
}

async function captureOneFrame({
  page,
  frame,
  framesDir,
  imageFormat,
  jpegQuality,
}: {
  page: Page;
  frame: number;
  framesDir: string;
  width: number;
  height: number;
  imageFormat: "jpeg" | "png";
  jpegQuality: number;
}): Promise<void> {
  await page.evaluate((n) => {
    (window as unknown as StoryboardWindow).__STORYBOARD__!.setFrame(n);
  }, frame);
  await waitReady(page);

  const ext = imageFormat === "png" ? "png" : "jpg";
  const file = path.join(
    framesDir,
    `frame-${String(frame).padStart(6, "0")}.${ext}`,
  );

  const root = page.locator("#root > div").first();
  await root.screenshot({
    path: file,
    type: imageFormat === "png" ? "png" : "jpeg",
    quality: imageFormat === "jpeg" ? jpegQuality : undefined,
    omitBackground: false,
    animations: "disabled",
    caret: "hide",
  });
}

/**
 * Capture a range of frames (possibly concurrent) from a served composition.
 */
export async function captureFrames({
  serveUrl,
  serveDir,
  workDir,
  manifest,
  formatId,
  framesDir,
  concurrency = Math.max(1, Math.floor(os.cpus().length / 2)),
  frameStart = 0,
  frameEnd,
  imageFormat = "jpeg",
  jpegQuality = 80,
  chromiumPath,
  ffmpegPath,
  onProgress,
}: CaptureOptions): Promise<CaptureResult> {
  const format =
    manifest.formats.find((f) => f.id === formatId) ?? manifest.formats[0];
  const total = totalDurationInFrames(manifest);
  const end = frameEnd ?? total - 1;
  const extractWorkDir =
    workDir ?? fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-vframes-"));

  prepareFramesDir(framesDir);

  const launchOptions: Parameters<typeof chromium.launch>[0] = {
    headless: true,
  };
  if (chromiumPath) {
    launchOptions.executablePath = chromiumPath;
  }

  const browser: Browser = await chromium.launch(launchOptions);

  try {
    const pages: Page[] = [];
    for (let i = 0; i < concurrency; i++) {
      const context = await browser.newContext({
        viewport: { width: format.width, height: format.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.addInitScript(
        ({ manifest: m, formatId: fid, assetBase }) => {
          const w = window as unknown as StoryboardWindow;
          w.__STORYBOARD_INPUT__ = {
            manifest: m,
            formatId: fid,
            initialFrame: 0,
          };
          w.__STORYBOARD_ASSET_BASE__ = assetBase;
        },
        {
          manifest,
          formatId: format.id,
          assetBase: "/",
        },
      );
      await page.goto(serveUrl, { waitUntil: "load", timeout: 120_000 });
      await waitReady(page);
      pages.push(page);
    }

    // Collect clips at scene starts (Video / Audio may not be mounted at frame 0)
    const sampleFrames = [
      ...new Set([0, ...scenePlacements(manifest).map((p) => p.from)]),
    ].filter((f) => f >= 0 && f < total);

    const audioById = new Map<string, AudioClipDescriptor>();
    const videoById = new Map<string, VideoClipDescriptor>();

    for (const sample of sampleFrames) {
      await pages[0].evaluate((n) => {
        (window as unknown as StoryboardWindow).__STORYBOARD__!.setFrame(n);
      }, sample);
      await waitReady(pages[0]);
      const audioSample = (await pages[0].evaluate(() =>
        (window as unknown as StoryboardWindow).__STORYBOARD__!.collectAudioClips(),
      )) as AudioClipDescriptor[];
      const videoSample = (await pages[0].evaluate(() =>
        (window as unknown as StoryboardWindow).__STORYBOARD__!.collectVideoClips(),
      )) as VideoClipDescriptor[];
      for (const clip of audioSample) audioById.set(clip.id, clip);
      for (const clip of videoSample) videoById.set(clip.id, clip);
    }

    const audioClips = [...audioById.values()];
    const videoClips = [...videoById.values()];

    // Pre-extract trimmed frames with FFmpeg (frame-accurate, like Remotion OffthreadVideo)
    if (videoClips.length > 0) {
      emitProgress({
        onProgress,
        event: {
          phase: "extracting",
          message: `Extracting ${videoClips.length} clip${videoClips.length === 1 ? "" : "s"}…`,
          current: 0,
          total: videoClips.length,
        },
      });
      const frameMap = await extractAllVideoClips({
        clips: videoClips,
        fps: manifest.fps,
        serveDir,
        workDir: extractWorkDir,
        ffmpegPath,
      });
      emitProgress({
        onProgress,
        event: {
          phase: "extracting",
          message: `Extracted ${videoClips.length} clip${videoClips.length === 1 ? "" : "s"}`,
          current: videoClips.length,
          total: videoClips.length,
        },
      });
      for (const page of pages) {
        await page.evaluate((map) => {
          (window as unknown as StoryboardWindow).__STORYBOARD_VIDEO_FRAMES__ =
            map;
        }, frameMap);
        // Remount timeline so <Video> switches from HTML5 to offthread <img>
        await page.evaluate((n) => {
          (window as unknown as StoryboardWindow).__STORYBOARD__!.setFrame(n);
        }, 0);
        await waitReady(page);
      }
    }

    const frames: number[] = [];
    for (let f = frameStart; f <= end; f++) frames.push(f);

    const totalFrames = frames.length;
    let completed = 0;

    emitProgress({
      onProgress,
      event: {
        phase: "capturing",
        message: `Capturing ${totalFrames} frames`,
        current: 0,
        total: totalFrames,
      },
    });

    let nextIndex = 0;
    async function worker(page: Page): Promise<void> {
      while (true) {
        const i = nextIndex++;
        if (i >= frames.length) return;
        const frame = frames[i];
        let attempts = 0;
        while (true) {
          try {
            await captureOneFrame({
              page,
              frame,
              framesDir,
              width: format.width,
              height: format.height,
              imageFormat,
              jpegQuality,
            });
            completed += 1;
            emitProgress({
              onProgress,
              event: {
                phase: "capturing",
                message: "Capturing frames",
                current: completed,
                total: totalFrames,
              },
            });
            break;
          } catch (err) {
            attempts++;
            if (attempts >= 3) throw err;
          }
        }
      }
    }

    await Promise.all(pages.map((p) => worker(p)));

    // Rename if we used a subset starting at 0 for stills — frames keep absolute indices.
    // FFmpeg sequence expects contiguous from 0; for full renders frameStart=0.
    if (frameStart === 0 && end === total - 1) {
      // ok
    } else if (frameStart === end) {
      // still: single file already named with absolute frame index
    } else {
      // remux helper expects contiguous — rewrite names for partial ranges
      const tmp = path.join(framesDir, "_reseq");
      fs.mkdirSync(tmp, { recursive: true });
      let i = 0;
      for (let f = frameStart; f <= end; f++) {
        const ext = imageFormat === "png" ? "png" : "jpg";
        const src = path.join(
          framesDir,
          `frame-${String(f).padStart(6, "0")}.${ext}`,
        );
        const dest = path.join(
          tmp,
          `frame-${String(i).padStart(6, "0")}.${ext}`,
        );
        fs.renameSync(src, dest);
        i++;
      }
      for (const file of fs.readdirSync(tmp)) {
        fs.renameSync(path.join(tmp, file), path.join(framesDir, file));
      }
      fs.rmdirSync(tmp);
    }

    return {
      framesDir,
      frameCount: end - frameStart + 1,
      width: format.width,
      height: format.height,
      fps: manifest.fps,
      audioClips,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Capture a single still PNG.
 */
export async function captureStill({
  serveUrl,
  serveDir,
  workDir,
  manifest,
  formatId,
  frame,
  outPath,
  chromiumPath,
  ffmpegPath,
}: {
  serveUrl: string;
  serveDir: string;
  workDir?: string;
  manifest: VideoManifest;
  formatId: string;
  frame: number;
  outPath: string;
  chromiumPath?: string;
  ffmpegPath?: string;
}): Promise<void> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-still-"));
  try {
    await captureFrames({
      serveUrl,
      serveDir,
      workDir,
      manifest,
      formatId,
      framesDir: tmp,
      concurrency: 1,
      frameStart: frame,
      frameEnd: frame,
      imageFormat: "png",
      chromiumPath,
      ffmpegPath,
    });
    const src = path.join(tmp, `frame-${String(frame).padStart(6, "0")}.png`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.copyFileSync(src, outPath);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
