import type { Scene, Track, VideoManifest } from "./manifest.js";

/**
 * Length of a single track in frames (gaps + scene durations).
 */
export function trackDurationInFrames({ track }: { track: Track }): number {
  let cursor = 0;
  for (const scene of track.scenes) {
    cursor += scene.gapBeforeFrames ?? 0;
    cursor += scene.durationInFrames;
  }
  return cursor;
}

/**
 * Full composition length: the longest track.
 */
export function totalDurationInFrames(manifest: VideoManifest): number {
  return Math.max(
    0,
    ...manifest.tracks.map((track) => trackDurationInFrames({ track })),
  );
}

/**
 * Alias of total duration (kept for callers that previously meant "content frames").
 */
export function contentDurationInFrames(manifest: VideoManifest): number {
  return totalDurationInFrames(manifest);
}

export type ScenePlacement = {
  trackId: string;
  scene: Scene;
  /** Composition frame where this scene begins. */
  from: number;
  durationInFrames: number;
};

/**
 * Absolute start of each scene on every track.
 */
export function scenePlacements(manifest: VideoManifest): ScenePlacement[] {
  const placements: ScenePlacement[] = [];
  for (const track of manifest.tracks) {
    let cursor = 0;
    for (const scene of track.scenes) {
      cursor += scene.gapBeforeFrames ?? 0;
      placements.push({
        trackId: track.id,
        scene,
        from: cursor,
        durationInFrames: scene.durationInFrames,
      });
      cursor += scene.durationInFrames;
    }
  }
  return placements;
}

/**
 * Unique composition frames where any scene begins (for capture sampling).
 */
export function sceneStartFrames(manifest: VideoManifest): number[] {
  return [
    ...new Set(scenePlacements(manifest).map((placement) => placement.from)),
  ].sort((a, b) => a - b);
}

/**
 * All scenes across tracks, in track then scene order.
 */
export function listScenes(manifest: VideoManifest): Scene[] {
  return manifest.tracks.flatMap((track) => track.scenes);
}

/**
 * Scene ids must be unique across every track.
 */
export function validateUniqueSceneIds(manifest: VideoManifest): string[] {
  const seen = new Map<string, string>();
  const errors: string[] = [];
  for (const track of manifest.tracks) {
    for (const scene of track.scenes) {
      const previous = seen.get(scene.id);
      if (previous) {
        errors.push(
          `Scene id "${scene.id}" is duplicated on tracks "${previous}" and "${track.id}"`,
        );
      } else {
        seen.set(scene.id, track.id);
      }
    }
  }
  return errors;
}
