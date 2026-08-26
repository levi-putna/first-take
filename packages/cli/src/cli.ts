import path from "node:path";
import { createRequire } from "node:module";
import { Command } from "commander";
import { consola } from "consola";
import {
  validateVideoFile,
  totalDurationInFrames,
} from "@levi-putna/storyboard-schema";
import { renderMedia, renderStill } from "@levi-putna/storyboard-renderer";
import { startPreview } from "@levi-putna/storyboard-preview";
import {
  isStoryboardMonorepo,
  resolveDefaultOutDir,
  scaffoldVideoProject,
  storyboardCliCommand,
  titleFromSlug,
} from "./create.js";
import { createCliProgress } from "./progress.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
  .name("storyboard")
  .description("Frame-deterministic React video engine")
  .version(version)
  .option(
    "--verbose",
    "Show detailed logs (FFmpeg output, phase detail)",
    false,
  );

/**
 * Read the global --verbose flag after Commander has parsed.
 */
function isVerbose(): boolean {
  return Boolean(program.opts<{ verbose?: boolean }>().verbose);
}

program
  .command("create")
  .description("Scaffold a new video project (video.json, scenes, assets)")
  .argument("<slug>", "Project slug (folder name and video.json slug)")
  .option(
    "--dir <path>",
    "Output directory (default: examples/<slug> when examples/ exists)",
  )
  .option("--title <title>", "Human-readable title (default: derived from slug)")
  .option(
    "--with-audio",
    "Include seriesAudio paths for jingle / bed / narration",
    false,
  )
  .option("--force", "Overwrite an existing non-empty directory", false)
  .action(
    (
      slug: string,
      opts: {
        dir?: string;
        title?: string;
        withAudio: boolean;
        force: boolean;
      },
    ) => {
      const cleaned = slug.trim();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(cleaned)) {
        consola.error(
          "Slug must start with a letter or number and contain only letters, numbers, hyphens, or underscores",
        );
        process.exit(1);
      }

      const outDir = path.resolve(
        opts.dir ?? resolveDefaultOutDir({ slug: cleaned }),
      );
      const title = opts.title ?? titleFromSlug({ slug: cleaned });

      try {
        consola.start(`Scaffolding ${cleaned} → ${outDir}`);
        const written = scaffoldVideoProject({
          slug: cleaned,
          outDir,
          title,
          withAudio: opts.withAudio,
          force: opts.force,
        });
        consola.success(`Created ${written.length} files in ${outDir}`);
        const cli = storyboardCliCommand();
        const maybeInstall = isStoryboardMonorepo()
          ? "  yarn install\n"
          : "  npm install   # or yarn, if you prefer\n";
        consola.info(`Next:
${maybeInstall}  ${cli} validate ${path.join(outDir, "video.json")}${opts.withAudio ? " --no-assets" : ""}
  ${cli} preview ${path.join(outDir, "video.json")}
  ${cli} render ${path.join(outDir, "video.json")}`);
      } catch (err) {
        consola.error(err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

program
  .command("validate")
  .argument("<video.json>", "Path to video manifest")
  .option("--no-assets", "Skip checking that audio files exist")
  .action((videoJson: string, opts: { assets: boolean }) => {
    const manifestPath = path.resolve(videoJson);
    const result = validateVideoFile({
      manifestPath,
      checkAssets: opts.assets,
    });
    if (!result.ok) {
      for (const err of result.errors) consola.error(err);
      process.exit(1);
    }
    const total = totalDurationInFrames(result.manifest);
    consola.success(
      `Valid: ${result.manifest.slug} (${total} frames @ ${result.manifest.fps}fps = ${(total / result.manifest.fps).toFixed(2)}s)`,
    );
  });

program
  .command("still")
  .argument("<video.json>", "Path to video manifest")
  .requiredOption("--frame <n>", "Frame index", (v) => parseInt(v, 10))
  .option("--format <id>", "Format id (default: first format)")
  .option("--out <path>", "Output PNG path", "out/still.png")
  .option("--chromium-path <path>", "Custom Chromium executable")
  .option("--ffmpeg-path <path>", "Custom ffmpeg executable")
  .action(
    async (
      videoJson: string,
      opts: {
        frame: number;
        format?: string;
        out: string;
        chromiumPath?: string;
        ffmpegPath?: string;
      },
    ) => {
      const verbose = isVerbose();
      const progress = createCliProgress({ verbose });
      const manifestPath = path.resolve(videoJson);
      const result = validateVideoFile({ manifestPath });
      if (!result.ok) {
        for (const err of result.errors) consola.error(err);
        process.exit(1);
      }
      const formatId = opts.format ?? result.manifest.formats[0].id;
      const outPath = path.resolve(opts.out);
      consola.start(`Still frame ${opts.frame} (${formatId}) → ${outPath}`);
      try {
        await renderStill({
          manifest: result.manifest,
          manifestPath,
          formatId,
          frame: opts.frame,
          outputPath: outPath,
          chromiumPath: opts.chromiumPath,
          ffmpegPath: opts.ffmpegPath,
          verbose,
          onProgress: progress.onProgress,
          onWarn: progress.onWarn,
        });
        progress.finish();
        consola.success(`Wrote ${outPath}`);
      } catch (err) {
        progress.finish();
        throw err;
      }
    },
  );

program
  .command("render")
  .argument("<video.json>", "Path to video manifest")
  .option("--format <id>", "Format id, or \"all\"", "all")
  .option("--out <path>", "Output MP4 path (single format only)")
  .option("--concurrency <n>", "Parallel browser pages", (v) => parseInt(v, 10))
  .option("--keep-frames", "Keep temp frame directory")
  .option(
    "--silent",
    "Encode without audio (mute). Does not quiet logs — use default quiet / --verbose for that",
  )
  .option("--no-audio", "Alias for --silent (encode without audio)")
  .option("--chromium-path <path>", "Custom Chromium executable")
  .option("--ffmpeg-path <path>", "Custom ffmpeg executable")
  .option("--ffprobe-path <path>", "Custom ffprobe executable")
  .action(
    async (
      videoJson: string,
      opts: {
        format: string;
        out?: string;
        concurrency?: number;
        keepFrames?: boolean;
        silent?: boolean;
        audio?: boolean;
        chromiumPath?: string;
        ffmpegPath?: string;
        ffprobePath?: string;
      },
    ) => {
      const verbose = isVerbose();
      const muteAudio = Boolean(opts.silent) || opts.audio === false;
      const manifestPath = path.resolve(videoJson);
      const result = validateVideoFile({ manifestPath });
      if (!result.ok) {
        for (const err of result.errors) consola.error(err);
        process.exit(1);
      }
      const { manifest } = result;
      const formats =
        opts.format === "all"
          ? manifest.formats
          : [
              manifest.formats.find((f) => f.id === opts.format) ??
                (() => {
                  throw new Error(`Unknown format: ${opts.format}`);
                })(),
            ];

      for (const format of formats) {
        const outPath = path.resolve(
          opts.out && formats.length === 1
            ? opts.out
            : `out/${manifest.slug}-${format.id}.mp4`,
        );
        const progress = createCliProgress({ verbose });
        consola.start(`Rendering ${manifest.slug} (${format.id}) → ${outPath}`);
        try {
          await renderMedia({
            manifest,
            manifestPath,
            formatId: format.id,
            outputPath: outPath,
            concurrency: opts.concurrency,
            keepFrames: opts.keepFrames,
            silent: muteAudio,
            chromiumPath: opts.chromiumPath,
            ffmpegPath: opts.ffmpegPath,
            ffprobePath: opts.ffprobePath,
            verbose,
            onProgress: progress.onProgress,
            onWarn: progress.onWarn,
          });
          progress.finish();
          consola.success(`Wrote ${outPath}`);
        } catch (err) {
          progress.finish();
          throw err;
        }
      }
    },
  );

program
  .command("preview")
  .argument("<video.json>", "Path to video manifest")
  .option("--port <n>", "Dev server port", (v) => parseInt(v, 10), 3333)
  .option("--no-open", "Do not open a browser (for embedded hosts)")
  .action(async (videoJson: string, opts: { port: number; noOpen?: boolean }) => {
    const manifestPath = path.resolve(videoJson);
    const result = validateVideoFile({
      manifestPath,
      checkAssets: false,
    });
    if (!result.ok) {
      for (const err of result.errors) consola.error(err);
      process.exit(1);
    }
    // Keep the process alive while Vite serves.
    await startPreview({
      manifestPath,
      manifest: result.manifest,
      port: opts.port,
      open: !opts.noOpen,
    });
    await new Promise(() => {
      /* run until killed */
    });
  });

program.parseAsync(process.argv).catch((err) => {
  consola.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
