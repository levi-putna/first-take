import type { Scene, Track, VideoManifest } from "./manifest.js";

/**
 * Crossfade overlap with the previous scene on the same track.
 * After a gap, transitionIn is a fade-in from empty and does not shorten the track.
 */
export function sequentialOverlapFrames({
  scene,
  index,
}: {
  scene: Scene;
  index: number;
}): number {
  if (index === 0) return 0;
  if ((scene.gapBeforeFrames ?? 0) > 0) return 0;
  return scene.transitionIn?.durationInFrames ?? 0;
}

/**
 * Length of a single track in frames (gaps + scenes − sequential overlaps).
 */
export function trackDurationInFrames({ track }: { track: Track }): number {
  let cursor = 0;
  for (let i = 0; i < track.scenes.length; i++) {
    const scene = track.scenes[i];
    cursor += scene.gapBeforeFrames ?? 0;
    cursor -= sequentialOverlapFrames({ scene, index: i });
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
    for (let i = 0; i < track.scenes.length; i++) {
      const scene = track.scenes[i];
      cursor += scene.gapBeforeFrames ?? 0;
      cursor -= sequentialOverlapFrames({ scene, index: i });
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
 * Ensures sequential (non-gap) fades are shorter than both adjacent scenes.
 * @returns list of human-readable error strings (empty if valid)
 */
export function validateTransitionLengths(manifest: VideoManifest): string[] {
  const errors: string[] = [];
  for (const track of manifest.tracks) {
    for (let i = 1; i < track.scenes.length; i++) {
      const prev = track.scenes[i - 1];
      const scene = track.scenes[i];
      const overlap = sequentialOverlapFrames({ scene, index: i });
      if (overlap <= 0) continue;
      if (overlap >= prev.durationInFrames) {
        errors.push(
          `Scene "${scene.id}" transitionIn (${overlap}f) must be shorter than previous scene "${prev.id}" (${prev.durationInFrames}f)`,
        );
      }
      if (overlap >= scene.durationInFrames) {
        errors.push(
          `Scene "${scene.id}" transitionIn (${overlap}f) must be shorter than its own duration (${scene.durationInFrames}f)`,
        );
      }
    }
  }
  return errors;
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
