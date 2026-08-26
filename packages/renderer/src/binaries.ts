import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);

/**
 * Return the path when it exists on disk; otherwise undefined so callers can
 * fall through to PATH.
 */
function existingFile({
  candidate,
}: {
  candidate?: string | null;
}): string | undefined {
  if (!candidate?.trim()) {
    return undefined;
  }
  return fs.existsSync(candidate) ? candidate : undefined;
}

/**
 * Path to the ffmpeg-static binary, if the install script downloaded it.
 */
function packagedFfmpegPath(): string | undefined {
  try {
    const candidate = require("ffmpeg-static") as string | null;
    return existingFile({ candidate });
  } catch {
    return undefined;
  }
}

/**
 * Path to the ffprobe-static binary, if the package is installed.
 */
function packagedFfprobePath(): string | undefined {
  try {
    const mod = require("ffprobe-static") as { path?: string };
    return existingFile({ candidate: mod.path });
  } catch {
    return undefined;
  }
}

/**
 * Pick an executable path with a stable priority: explicit option, env, packaged
 * binary, then the command name on PATH.
 */
export function resolveBinaryPath({
  fallbackName,
  explicitPath,
  envValue,
  packagedPath,
}: {
  fallbackName: string;
  explicitPath?: string;
  envValue?: string;
  packagedPath?: string | null;
}): string {
  const trimmedExplicit = explicitPath?.trim();
  if (trimmedExplicit) {
    return trimmedExplicit;
  }

  const trimmedEnv = envValue?.trim();
  if (trimmedEnv) {
    return trimmedEnv;
  }

  const trimmedPackaged = packagedPath?.trim();
  if (trimmedPackaged) {
    return trimmedPackaged;
  }

  return fallbackName;
}

/**
 * Resolve ffmpeg: `--ffmpeg-path` / `ffmpegPath`, `STORYBOARD_FFMPEG`, the
 * packaged binary, then `ffmpeg` on PATH.
 */
export function getFfmpegPath({
  ffmpegPath,
}: {
  ffmpegPath?: string;
} = {}): string {
  return resolveBinaryPath({
    fallbackName: "ffmpeg",
    explicitPath: ffmpegPath,
    envValue: process.env.STORYBOARD_FFMPEG,
    packagedPath: packagedFfmpegPath(),
  });
}

/**
 * Resolve ffprobe: `--ffprobe-path` / `ffprobePath`, `STORYBOARD_FFPROBE`, the
 * packaged binary, then `ffprobe` on PATH.
 */
export function getFfprobePath({
  ffprobePath,
}: {
  ffprobePath?: string;
} = {}): string {
  return resolveBinaryPath({
    fallbackName: "ffprobe",
    explicitPath: ffprobePath,
    envValue: process.env.STORYBOARD_FFPROBE,
    packagedPath: packagedFfprobePath(),
  });
}
