import {
  scenePlacements,
  sequentialOverlapFrames,
  validateTransitionLengths,
  type Scene,
  type Track,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";

export type PlacedClip = {
  sceneId: string;
  scene: Scene;
  from: number;
  durationInFrames: number;
};

const DEFAULT_SNAP_THRESHOLD = 6;

/**
 * Placements for a single track in array order.
 */
export function trackPlacements({ track }: { track: Track }): PlacedClip[] {
  const clips: PlacedClip[] = [];
  let cursor = 0;
  for (let i = 0; i < track.scenes.length; i++) {
    const scene = track.scenes[i];
    cursor += scene.gapBeforeFrames ?? 0;
    cursor -= sequentialOverlapFrames({ scene, index: i });
    clips.push({
      sceneId: scene.id,
      scene,
      from: cursor,
      durationInFrames: scene.durationInFrames,
    });
    cursor += scene.durationInFrames;
  }
  return clips;
}

/**
 * Locate a scene within the manifest tracks.
 */
export function findSceneLocation({
  manifest,
  sceneId,
}: {
  manifest: VideoManifest;
  sceneId: string;
}): { trackIndex: number; sceneIndex: number; track: Track; scene: Scene } | null {
  for (let trackIndex = 0; trackIndex < manifest.tracks.length; trackIndex++) {
    const track = manifest.tracks[trackIndex];
    const sceneIndex = track.scenes.findIndex((scene) => scene.id === sceneId);
    if (sceneIndex >= 0) {
      return {
        trackIndex,
        sceneIndex,
        track,
        scene: track.scenes[sceneIndex],
      };
    }
  }
  return null;
}

/**
 * Snap a frame to the nearest target within a threshold.
 */
export function snapFrame({
  frame,
  targets,
  threshold = DEFAULT_SNAP_THRESHOLD,
}: {
  frame: number;
  targets: number[];
  threshold?: number;
}): number {
  let best = frame;
  let bestDistance = threshold + 1;
  for (const target of targets) {
    const distance = Math.abs(target - frame);
    if (distance <= threshold && distance < bestDistance) {
      best = target;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Collect snap targets for a track (edges, playhead, frame zero).
 */
export function snapTargetsForTrack({
  track,
  excludeSceneId,
  playheadFrame,
}: {
  track: Track;
  excludeSceneId?: string;
  playheadFrame?: number;
}): number[] {
  const targets = new Set<number>([0]);
  if (playheadFrame != null) targets.add(Math.max(0, playheadFrame));
  for (const clip of trackPlacements({ track })) {
    if (clip.sceneId === excludeSceneId) continue;
    targets.add(clip.from);
    targets.add(clip.from + clip.durationInFrames);
  }
  return [...targets];
}

/**
 * Whether two intervals overlap on a lane.
 */
export function intervalsOverlap({
  aStart,
  aEnd,
  bStart,
  bEnd,
}: {
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
}): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Allowed sequential fade overlap when `later` immediately follows `earlier`.
 */
export function allowedFadeOverlap({
  earlier,
  later,
}: {
  earlier: PlacedClip;
  later: { from: number; scene: Scene };
}): number {
  const prevEnd = earlier.from + earlier.durationInFrames;
  if (later.from >= prevEnd) return 0;
  return later.scene.transitionIn?.durationInFrames ?? 0;
}

/**
 * True when a candidate clip can sit at `from` without forbidden overlap.
 */
export function canPlaceClip({
  clips,
  sceneId,
  from,
  durationInFrames,
  scene,
}: {
  clips: PlacedClip[];
  sceneId: string;
  from: number;
  durationInFrames: number;
  scene: Scene;
}): boolean {
  const candidate: PlacedClip = {
    sceneId,
    scene,
    from,
    durationInFrames,
  };
  const all = [
    ...clips.filter((clip) => clip.sceneId !== sceneId),
    candidate,
  ].sort((a, b) => a.from - b.from || a.sceneId.localeCompare(b.sceneId));

  for (let i = 0; i < all.length; i++) {
    const a = all[i];
    const aEnd = a.from + a.durationInFrames;
    for (let j = i + 1; j < all.length; j++) {
      const b = all[j];
      const bEnd = b.from + b.durationInFrames;
      if (
        !intervalsOverlap({
          aStart: a.from,
          aEnd,
          bStart: b.from,
          bEnd,
        })
      ) {
        continue;
      }

      if (j === i + 1) {
        const fade = allowedFadeOverlap({
          earlier: a,
          later: { from: b.from, scene: b.scene },
        });
        const overlap = Math.min(aEnd, bEnd) - b.from;
        if (fade > 0 && overlap <= fade) {
          continue;
        }
      }

      return false;
    }
  }

  return true;
}

/**
 * Find the nearest legal start frame on a track.
 */
export function nearestValidStart({
  clips,
  sceneId,
  desiredFrom,
  durationInFrames,
  scene,
}: {
  clips: PlacedClip[];
  sceneId: string;
  desiredFrom: number;
  durationInFrames: number;
  scene: Scene;
}): number {
  const start = Math.max(0, Math.round(desiredFrom));
  if (
    canPlaceClip({
      clips,
      sceneId,
      from: start,
      durationInFrames,
      scene,
    })
  ) {
    return start;
  }

  const others = clips
    .filter((clip) => clip.sceneId !== sceneId)
    .sort((a, b) => a.from - b.from);
  const candidates = new Set<number>([0, start]);

  for (const clip of others) {
    const end = clip.from + clip.durationInFrames;
    candidates.add(end);
    candidates.add(Math.max(0, clip.from - durationInFrames));
    const fade = clip.scene.transitionIn?.durationInFrames ?? 0;
    if (fade > 0) {
      candidates.add(Math.max(0, end - fade));
    }
  }

  let best = start;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (
      !canPlaceClip({
        clips,
        sceneId,
        from: candidate,
        durationInFrames,
        scene,
      })
    ) {
      continue;
    }
    const distance = Math.abs(candidate - start);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Rebuild scene gaps from sorted absolute start frames.
 */
export function scenesFromStartFrames({
  placements,
}: {
  placements: { scene: Scene; from: number }[];
}): Scene[] {
  const sorted = [...placements].sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    return a.scene.id.localeCompare(b.scene.id);
  });

  return sorted.map((entry, index) => {
    const { scene, from } = entry;
    if (index === 0) {
      return {
        ...scene,
        gapBeforeFrames: Math.max(0, from),
      };
    }

    const prev = sorted[index - 1];
    const prevEnd = prev.from + prev.scene.durationInFrames;
    const leadGap = from - prevEnd;
    const actualOverlap = prevEnd - from;

    if (leadGap > 0) {
      return {
        ...scene,
        gapBeforeFrames: leadGap,
      };
    }

    if (leadGap === 0 && (scene.gapBeforeFrames ?? 0) > 0) {
      return {
        ...scene,
        gapBeforeFrames: 0,
        transitionIn: null,
      };
    }

    const overlap = scene.transitionIn?.durationInFrames ?? 0;
    if (overlap > 0 && actualOverlap > 0 && actualOverlap <= overlap) {
      return {
        ...scene,
        gapBeforeFrames: 0,
        transitionIn: {
          ...scene.transitionIn,
          durationInFrames: actualOverlap,
        },
      };
    }

    if (leadGap === 0) {
      return {
        ...scene,
        gapBeforeFrames: 0,
        ...(actualOverlap === 0 ? { transitionIn: null } : {}),
      };
    }

    throw new Error(
      `Scene "${scene.id}" overlaps "${prev.scene.id}" without a legal fade`,
    );
  });
}

/**
 * Rebuild a track's scenes from target start frames.
 */
export function rebuildTrack({
  track,
  targets,
}: {
  track: Track;
  targets: { sceneId: string; from: number }[];
}): Track {
  const byId = new Map(track.scenes.map((scene) => [scene.id, scene]));
  const placements = targets.map((target) => {
    const scene = byId.get(target.sceneId);
    if (!scene) {
      throw new Error(`Unknown scene "${target.sceneId}" on track "${track.id}"`);
    }
    return { scene, from: target.from };
  });
  return {
    ...track,
    scenes: scenesFromStartFrames({ placements }),
  };
}

/**
 * Move a scene to a new start frame, optionally on another track.
 */
export function moveScene({
  manifest,
  sceneId,
  targetTrackId,
  startFrame,
  playheadFrame,
}: {
  manifest: VideoManifest;
  sceneId: string;
  targetTrackId: string;
  startFrame: number;
  playheadFrame?: number;
}): VideoManifest {
  const location = findSceneLocation({ manifest, sceneId });
  if (!location) {
    throw new Error(`Unknown scene "${sceneId}"`);
  }

  const targetTrackIndex = manifest.tracks.findIndex(
    (track) => track.id === targetTrackId,
  );
  if (targetTrackIndex < 0) {
    throw new Error(`Unknown track "${targetTrackId}"`);
  }

  const scene = { ...location.scene };
  const sourceTrack = manifest.tracks[location.trackIndex];
  const remainingPlacements = trackPlacements({ track: sourceTrack }).filter(
    (clip) => clip.sceneId !== sceneId,
  );
  const sourceRebuilt = rebuildTrack({
    track: {
      ...sourceTrack,
      scenes: remainingPlacements.map((clip) => clip.scene),
    },
    targets: remainingPlacements.map((clip) => ({
      sceneId: clip.sceneId,
      from: clip.from,
    })),
  });

  const targetTrack =
    location.track.id === targetTrackId
      ? sourceRebuilt
      : manifest.tracks[targetTrackIndex];

  const snapped = snapFrame({
    frame: startFrame,
    targets: snapTargetsForTrack({
      track: targetTrack,
      excludeSceneId: sceneId,
      playheadFrame,
    }),
  });

  const existing = trackPlacements({ track: targetTrack });
  const validFrom = nearestValidStart({
    clips: existing,
    sceneId,
    desiredFrom: snapped,
    durationInFrames: scene.durationInFrames,
    scene,
  });

  const targets = [
    ...existing.map((clip) => ({
      sceneId: clip.sceneId,
      from: clip.from,
    })),
    { sceneId, from: validFrom },
  ];

  const targetRebuilt = rebuildTrack({
    track: {
      ...targetTrack,
      scenes: targetTrack.scenes.some((entry) => entry.id === sceneId)
        ? targetTrack.scenes
        : [...targetTrack.scenes, scene],
    },
    targets,
  });

  const tracks = manifest.tracks.map((track, index) => {
    if (index === location.trackIndex && location.track.id !== targetTrackId) {
      return sourceRebuilt;
    }
    if (index === targetTrackIndex) {
      return targetRebuilt;
    }
    if (
      index === location.trackIndex &&
      location.track.id === targetTrackId
    ) {
      return targetRebuilt;
    }
    return track;
  });

  return { ...manifest, tracks };
}

/**
 * Trim a scene by changing its duration in frames.
 * Later clips keep their absolute composition start; gaps are updated instead of rippling.
 */
export function trimSceneEnd({
  manifest,
  sceneId,
  durationInFrames,
}: {
  manifest: VideoManifest;
  sceneId: string;
  durationInFrames: number;
}): VideoManifest {
  const location = findSceneLocation({ manifest, sceneId });
  if (!location) {
    throw new Error(`Unknown scene "${sceneId}"`);
  }

  const requestedDuration = Math.max(1, Math.round(durationInFrames));
  const track = location.track;
  const clips = trackPlacements({ track });
  const clip = clips.find((entry) => entry.sceneId === sceneId);
  if (!clip) {
    throw new Error(`Scene "${sceneId}" is not on track "${track.id}"`);
  }

  const sorted = [...clips].sort((a, b) => a.from - b.from);
  const index = sorted.findIndex((entry) => entry.sceneId === sceneId);
  const next = sorted[index + 1];
  let maxDuration = requestedDuration;

  if (next) {
    const fade = allowedFadeOverlap({
      earlier: { ...clip, durationInFrames: requestedDuration },
      later: { from: next.from, scene: next.scene },
    });
    maxDuration = Math.min(maxDuration, next.from + fade - clip.from);
  }

  let minDuration = 1;
  if (next && (next.scene.gapBeforeFrames ?? 0) === 0) {
    const fade = next.scene.transitionIn?.durationInFrames ?? 0;
    if (fade > 0 && requestedDuration > next.from - clip.from) {
      minDuration = fade + 1;
    }
  }

  const duration = Math.max(
    minDuration,
    Math.min(requestedDuration, maxDuration),
  );

  const updatedScenes = track.scenes.map((scene) =>
    scene.id === sceneId ? { ...scene, durationInFrames: duration } : scene,
  );

  const rebuiltTrack = rebuildTrack({
    track: { ...track, scenes: updatedScenes },
    targets: clips.map((placement) => ({
      sceneId: placement.sceneId,
      from: placement.from,
    })),
  });

  const tracks = manifest.tracks.map((entry, trackIndex) =>
    trackIndex === location.trackIndex ? rebuiltTrack : entry,
  );

  const nextManifest = { ...manifest, tracks };
  const errors = validateTransitionLengths(nextManifest);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
  return nextManifest;
}

/**
 * Allocate a unique track id.
 */
export function createUniqueTrackId({
  manifest,
  base = "track",
}: {
  manifest: VideoManifest;
  base?: string;
}): string {
  const existing = new Set(manifest.tracks.map((track) => track.id));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

/**
 * Append an empty track to the manifest.
 */
export function addTrack({
  manifest,
  id,
  title,
  description,
}: {
  manifest: VideoManifest;
  id?: string;
  title?: string;
  description?: string;
}): VideoManifest {
  const trackId = id ?? createUniqueTrackId({ manifest });
  if (manifest.tracks.some((track) => track.id === trackId)) {
    throw new Error(`Track id "${trackId}" already exists`);
  }
  return {
    ...manifest,
    tracks: [
      ...manifest.tracks,
      {
        id: trackId,
        title: title ?? trackId,
        ...(description ? { description } : {}),
        scenes: [],
      },
    ],
  };
}

/**
 * Update track metadata.
 */
export function updateTrack({
  manifest,
  trackId,
  title,
  description,
}: {
  manifest: VideoManifest;
  trackId: string;
  title?: string;
  description?: string | null;
}): VideoManifest {
  return {
    ...manifest,
    tracks: manifest.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const next = { ...track };
      if (title != null) next.title = title;
      if (description === null) {
        delete next.description;
      } else if (description != null) {
        next.description = description;
      }
      return next;
    }),
  };
}

/**
 * Reorder tracks (render / paint order).
 */
export function reorderTracks({
  manifest,
  trackIds,
}: {
  manifest: VideoManifest;
  trackIds: string[];
}): VideoManifest {
  if (trackIds.length !== manifest.tracks.length) {
    throw new Error("trackIds must include every track exactly once");
  }
  const byId = new Map(manifest.tracks.map((track) => [track.id, track]));
  const next = trackIds.map((id) => {
    const track = byId.get(id);
    if (!track) throw new Error(`Unknown track "${id}"`);
    return track;
  });
  if (next.length !== manifest.tracks.length) {
    throw new Error("trackIds must include every track exactly once");
  }
  return { ...manifest, tracks: next };
}

/**
 * Compare two manifests for structural timeline equality (ignoring props).
 */
export function timelineStructureEqual({
  left,
  right,
}: {
  left: VideoManifest;
  right: VideoManifest;
}): boolean {
  if (left.tracks.length !== right.tracks.length) return false;
  for (let i = 0; i < left.tracks.length; i++) {
    const a = left.tracks[i];
    const b = right.tracks[i];
    if (a.id !== b.id) return false;
    if ((a.title ?? "") !== (b.title ?? "")) return false;
    if ((a.description ?? "") !== (b.description ?? "")) return false;
    if (a.scenes.length !== b.scenes.length) return false;
    for (let j = 0; j < a.scenes.length; j++) {
      const sa = a.scenes[j];
      const sb = b.scenes[j];
      if (sa.id !== sb.id) return false;
      if (sa.durationInFrames !== sb.durationInFrames) return false;
      if ((sa.gapBeforeFrames ?? 0) !== (sb.gapBeforeFrames ?? 0)) return false;
    }
  }
  const leftPlacements = scenePlacements(left);
  const rightPlacements = scenePlacements(right);
  if (leftPlacements.length !== rightPlacements.length) return false;
  for (let i = 0; i < leftPlacements.length; i++) {
    if (leftPlacements[i].from !== rightPlacements[i].from) return false;
    if (leftPlacements[i].trackId !== rightPlacements[i].trackId) return false;
  }
  return true;
}
