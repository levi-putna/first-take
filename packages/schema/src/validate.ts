import fs from "node:fs";
import { videoManifestSchema, type VideoManifest } from "./manifest.js";
import { listScenes, validateUniqueSceneIds } from "./duration.js";
import { assertAssetsExist } from "./assets.js";

export type ValidateVideoResult =
  | { ok: true; manifest: VideoManifest }
  | { ok: false; errors: string[] };

/**
 * Detect legacy schemaVersion 2 or transitionIn fields in raw JSON.
 */
function legacyManifestErrors(raw: unknown): string[] {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) return errors;

  const root = raw as Record<string, unknown>;
  if (root.schemaVersion === 2) {
    errors.push(
      'schemaVersion 2 is no longer supported. Bump to 3 and remove transitionIn from scenes. Use overlapping tracks and in-scene fades instead.',
    );
  }

  const tracks = root.tracks;
  if (!Array.isArray(tracks)) return errors;

  for (const track of tracks) {
    if (typeof track !== "object" || track === null) continue;
    const scenes = (track as Record<string, unknown>).scenes;
    if (!Array.isArray(scenes)) continue;
    for (const scene of scenes) {
      if (typeof scene !== "object" || scene === null) continue;
      const sceneObj = scene as Record<string, unknown>;
      if ("transitionIn" in sceneObj) {
        errors.push(
          `Scene "${String(sceneObj.id ?? "?")}" has transitionIn, which was removed in schemaVersion 3. Use overlapping tracks and fade motion inside the scene component.`,
        );
      }
    }
  }

  return errors;
}

/**
 * Parse and validate a video.json file (schema, optional assets).
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

  errors.push(...legacyManifestErrors(raw));
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const parsed = videoManifestSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return { ok: false, errors };
  }

  const manifest = parsed.data;
  errors.push(...validateUniqueSceneIds(manifest));

  if (!manifest.tracks.some((track) => track.scenes.length > 0)) {
    errors.push("At least one track must contain a scene");
  }

  if (checkAssets) {
    errors.push(...assertAssetsExist({ manifest, manifestPath }));
  }

  // Non-component visual types are reserved but not implemented in MVP
  for (const scene of listScenes(manifest)) {
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
