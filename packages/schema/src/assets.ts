import fs from "node:fs";
import path from "node:path";
import type { VideoManifest } from "./manifest.js";

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
 * Collect audio (and lead-in component is not an asset file) paths that must exist.
 */
export function listRequiredAudioAssets(manifest: VideoManifest): string[] {
  const audio = manifest.seriesAudio;
  if (!audio) return [];
  return [audio.jingle, audio.bed, audio.narration].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
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
 * Resolve a scene/lead-in component module path relative to the manifest file.
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
  for (const scene of manifest.scenes) {
    paths.add(scene.component);
  }
  if (manifest.leadIn?.component) {
    paths.add(manifest.leadIn.component);
  }
  return [...paths];
}
