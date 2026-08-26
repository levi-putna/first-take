import fs from "node:fs";
import { videoManifestSchema, type VideoManifest } from "./manifest.js";
import { validateTransitionLengths } from "./duration.js";
import { assertAssetsExist } from "./assets.js";

export type ValidateVideoResult =
  | { ok: true; manifest: VideoManifest }
  | { ok: false; errors: string[] };

/**
 * Parse and validate a video.json file (schema, transitions, optional assets).
 */
export function validateVideoFile({
  manifestPath,
  checkAssets = true,
}: {
  manifestPath: string;
  checkAssets?: boolean;
}): ValidateVideoResult {
  const errors: string[] = [];

  if (!fs.existsSync(manifestPath)) {
    return { ok: false, errors: [`File not found: ${manifestPath}`] };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    return {
      ok: false,
      errors: [`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  const parsed = videoManifestSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return { ok: false, errors };
  }

  const manifest = parsed.data;
  errors.push(...validateTransitionLengths(manifest));

  if (checkAssets) {
    errors.push(...assertAssetsExist({ manifest, manifestPath }));
  }

  // Non-component visual types are reserved but not implemented in MVP
  for (const scene of manifest.scenes) {
    if (scene.visualType !== "component") {
      errors.push(
        `Scene "${scene.id}" visualType "${scene.visualType}" is not supported in MVP (use "component")`,
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, manifest };
}

/**
 * Parse a raw object as a VideoManifest (throws on failure).
 */
export function parseVideoManifest(raw: unknown): VideoManifest {
  return videoManifestSchema.parse(raw);
}
