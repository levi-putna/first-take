import fs from "node:fs";
import path from "node:path";
import type { VideoManifest } from "./manifest.js";
import { listScenes } from "./duration.js";

const AUDIO_EXT = /\.(mp3|wav|m4a|aac)$/i;

/**
 * Resolve an asset path relative to the video.json directory and assetsRoot.
 */
export function resolveAssetPath({
  manifestPath,
  assetsRoot,
  relativePath,
}: {
  manifestPath: string;
  assetsRoot: string;
  relativePath: string;
}): string {
  const manifestDir = path.dirname(path.resolve(manifestPath));
  const root = path.resolve(manifestDir, assetsRoot);
  return path.resolve(root, relativePath);
}

/**
 * Recursively collect string values that look like audio file paths.
 */
function collectAudioPropPaths({
  value,
  out,
}: {
  value: unknown;
  out: string[];
}): void {
  if (typeof value === "string") {
    if (AUDIO_EXT.test(value)) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAudioPropPaths({ value: item, out });
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectAudioPropPaths({ value: item, out });
    }
  }
}

/**
 * Audio paths declared as scene props (best-effort; not a full asset graph).
 */
export function listRequiredAudioAssets(manifest: VideoManifest): string[] {
  const paths: string[] = [];
  for (const scene of listScenes(manifest)) {
    collectAudioPropPaths({ value: scene.props, out: paths });
  }
  return [...new Set(paths)];
}

/**
 * Assert all referenced audio files exist on disk.
 * @returns error messages for missing files
 */
export function assertAssetsExist({
  manifest,
  manifestPath,
}: {
  manifest: VideoManifest;
  manifestPath: string;
}): string[] {
  const errors: string[] = [];
  const assetsRoot = manifest.assetsRoot ?? ".";
  for (const rel of listRequiredAudioAssets(manifest)) {
    const abs = resolveAssetPath({
      manifestPath,
      assetsRoot,
      relativePath: rel,
    });
    if (!fs.existsSync(abs)) {
      errors.push(`Missing asset: ${rel} (resolved ${abs})`);
    }
  }
  return errors;
}

/**
 * Resolve a scene component module path relative to the manifest file.
 */
export function resolveComponentPath({
  manifestPath,
  componentPath,
}: {
  manifestPath: string;
  componentPath: string;
}): string {
  const manifestDir = path.dirname(path.resolve(manifestPath));
  return path.resolve(manifestDir, componentPath);
}

/**
 * Unique component module paths referenced by the manifest.
 */
export function collectComponentPaths(manifest: VideoManifest): string[] {
  const paths = new Set<string>();
  for (const scene of listScenes(manifest)) {
    paths.add(scene.component);
  }
  return [...paths];
}
