import type { VideoManifest } from "./manifest.js";

/**
 * Returns lead-in length in frames from series audio config.
 */
export function leadInFrames(manifest: VideoManifest): number {
  const seconds = manifest.seriesAudio?.leadInSeconds ?? 0;
  return Math.round(seconds * manifest.fps);
}

/**
 * Sum of scene durations minus transition overlaps.
 * A scene's transitionIn overlaps with the previous scene.
 */
export function contentDurationInFrames(manifest: VideoManifest): number {
  const sum = manifest.scenes.reduce((acc, scene) => acc + scene.durationInFrames, 0);
  const overlaps = manifest.scenes.reduce((acc, scene, index) => {
    if (index === 0) return acc;
    const t = scene.transitionIn?.durationInFrames ?? 0;
    return acc + t;
  }, 0);
  return sum - overlaps;
}

/**
 * Full composition length: lead-in + content + optional tail.
 */
export function totalDurationInFrames(manifest: VideoManifest): number {
  const tailSeconds = manifest.seriesAudio?.tailSeconds ?? 0;
  const tailFrames = Math.round(tailSeconds * manifest.fps);
  return leadInFrames(manifest) + contentDurationInFrames(manifest) + tailFrames;
}

/**
 * Ensures each transition is shorter than both adjacent scenes.
 * @returns list of human-readable error strings (empty if valid)
 */
export function validateTransitionLengths(manifest: VideoManifest): string[] {
  const errors: string[] = [];
  for (let i = 1; i < manifest.scenes.length; i++) {
    const prev = manifest.scenes[i - 1];
    const scene = manifest.scenes[i];
    const t = scene.transitionIn?.durationInFrames ?? 0;
    if (t <= 0) continue;
    if (t >= prev.durationInFrames) {
      errors.push(
        `Scene "${scene.id}" transitionIn (${t}f) must be shorter than previous scene "${prev.id}" (${prev.durationInFrames}f)`,
      );
    }
    if (t >= scene.durationInFrames) {
      errors.push(
        `Scene "${scene.id}" transitionIn (${t}f) must be shorter than its own duration (${scene.durationInFrames}f)`,
      );
    }
  }
  return errors;
}

/**
 * Absolute composition frame where each scene's visual content begins
 * (after lead-in and accounting for overlaps).
 */
export function sceneStartFrames(manifest: VideoManifest): number[] {
  const lead = leadInFrames(manifest);
  const starts: number[] = [];
  let cursor = lead;
  for (let i = 0; i < manifest.scenes.length; i++) {
    const scene = manifest.scenes[i];
    const overlap = i === 0 ? 0 : (scene.transitionIn?.durationInFrames ?? 0);
    cursor -= overlap;
    starts.push(cursor);
    cursor += scene.durationInFrames;
  }
  return starts;
}
