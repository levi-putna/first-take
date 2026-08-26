import {
  scenePlacements,
  totalDurationInFrames,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";

export type TimelineClip = {
  key: string;
  sceneId: string;
  title: string;
  startFrame: number;
  durationInFrames: number;
};

export type TimelineLane = {
  trackId: string;
  title: string;
  clips: TimelineClip[];
};

/**
 * One lane per track, clips placed by composition start frame.
 */
export function timelineLanes({
  manifest,
}: {
  manifest: VideoManifest;
}): TimelineLane[] {
  const placements = scenePlacements(manifest);
  return manifest.tracks.map((track) => ({
    trackId: track.id,
    title: track.title ?? track.id,
    clips: placements
      .filter((placement) => placement.trackId === track.id)
      .map((placement) => ({
        key: placement.scene.id,
        sceneId: placement.scene.id,
        title: placement.scene.title,
        startFrame: placement.from,
        durationInFrames: placement.durationInFrames,
      })),
  }));
}

/**
 * Clip covering a composition frame, preferring the topmost track.
 */
export function clipAtFrame({
  lanes,
  frame,
}: {
  lanes: TimelineLane[];
  frame: number;
}): TimelineClip | undefined {
  let found: TimelineClip | undefined;
  for (const lane of lanes) {
    for (const clip of lane.clips) {
      if (
        frame >= clip.startFrame &&
        frame < clip.startFrame + clip.durationInFrames
      ) {
        found = clip;
      }
    }
  }
  return found;
}

/**
 * Look up a clip by scene id.
 */
export function clipBySceneId({
  lanes,
  sceneId,
}: {
  lanes: TimelineLane[];
  sceneId: string;
}): TimelineClip | undefined {
  for (const lane of lanes) {
    const clip = lane.clips.find((entry) => entry.sceneId === sceneId);
    if (clip) return clip;
  }
  return undefined;
}

export function compositionDuration({
  manifest,
}: {
  manifest: VideoManifest;
}): number {
  return totalDurationInFrames(manifest);
}
