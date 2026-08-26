/**
 * Timeline zoom helpers: fit/clamp ppf, visible span, and ruler tick steps.
 * Zoom is modelled as pixels per composition frame.
 */

/** Maximum pixels per frame when zoomed all the way in. */
export const TIMELINE_MAX_PIXELS_PER_FRAME = 8;

/** Minimum major-tick spacing in pixels before the ruler steps up. */
export const TIMELINE_MIN_MAJOR_TICK_PX = 64;

/** Preferred opening window when the piece is longer than this (seconds). */
export const TIMELINE_DEFAULT_VISIBLE_SECONDS = 45;

/** Minimum visible duration when zoomed in (seconds). */
export const TIMELINE_MIN_VISIBLE_SECONDS = 2;

const NICE_SECONDS = [
  1 / 30,
  2 / 30,
  5 / 30,
  10 / 30,
  0.5,
  1,
  2,
  5,
  10,
  15,
  30,
  60,
  120,
  300,
  600,
  900,
  1800,
  3600,
  7200,
  21600,
] as const;

/** Visible-seconds ladder for toolbar zoom buttons. */
export const TIMELINE_ZOOM_LADDER_SECONDS = [
  2, 5, 10, 15, 30, 45, 60, 120, 300, 600, 900, 1800, 3600, 7200,
] as const;

export type TimelineViewport = {
  startFrame: number;
  endFrame: number;
};

/**
 * Pixels per frame that fits the full composition in the track width.
 */
export function fitPixelsPerFrame({
  trackWidth,
  durationInFrames,
}: {
  trackWidth: number;
  durationInFrames: number;
}): number {
  const width = Math.max(1, trackWidth);
  const duration = Math.max(1, durationInFrames);
  return width / duration;
}

/**
 * Visible frame count for a given zoom and track width.
 */
export function visibleFramesFromPpf({
  pixelsPerFrame,
  trackWidth,
}: {
  pixelsPerFrame: number;
  trackWidth: number;
}): number {
  const ppf = Math.max(0.0001, pixelsPerFrame);
  return Math.max(1, trackWidth / ppf);
}

/**
 * Pixels per frame for a desired visible frame window.
 */
export function ppfFromVisibleFrames({
  trackWidth,
  visibleFrames,
}: {
  trackWidth: number;
  visibleFrames: number;
}): number {
  const width = Math.max(1, trackWidth);
  const frames = Math.max(1, visibleFrames);
  return width / frames;
}

/**
 * Minimum visible frames at max zoom-in for the current track width and fps.
 */
export function minVisibleFrames({
  trackWidth,
  fps,
  maxPixelsPerFrame = TIMELINE_MAX_PIXELS_PER_FRAME,
  minVisibleSeconds = TIMELINE_MIN_VISIBLE_SECONDS,
}: {
  trackWidth: number;
  fps: number;
  maxPixelsPerFrame?: number;
  minVisibleSeconds?: number;
}): number {
  const fromSeconds = Math.max(1, Math.round(minVisibleSeconds * Math.max(1, fps)));
  const fromPpf = Math.max(1, Math.ceil(trackWidth / maxPixelsPerFrame));
  return Math.max(fromSeconds, fromPpf);
}

/**
 * Clamps pixels-per-frame between fit-all (min zoom) and max zoom-in.
 */
export function clampPixelsPerFrame({
  pixelsPerFrame,
  trackWidth,
  durationInFrames,
  fps,
  maxPixelsPerFrame = TIMELINE_MAX_PIXELS_PER_FRAME,
}: {
  pixelsPerFrame: number;
  trackWidth: number;
  durationInFrames: number;
  fps: number;
  maxPixelsPerFrame?: number;
}): number {
  if (trackWidth <= 0 || durationInFrames <= 0) {
    return Math.max(0.0001, pixelsPerFrame);
  }

  const fit = fitPixelsPerFrame({ trackWidth, durationInFrames });
  const minVisible = Math.min(
    durationInFrames,
    minVisibleFrames({ trackWidth, fps, maxPixelsPerFrame }),
  );
  const maxPpf = ppfFromVisibleFrames({
    trackWidth,
    visibleFrames: minVisible,
  });

  const clamped = Math.min(maxPpf, Math.max(fit, pixelsPerFrame));
  return Number(clamped.toFixed(4));
}

/**
 * Default opening zoom: ~45s window, or the full piece if shorter.
 */
export function defaultPixelsPerFrame({
  trackWidth,
  durationInFrames,
  fps,
  targetVisibleSeconds = TIMELINE_DEFAULT_VISIBLE_SECONDS,
}: {
  trackWidth: number;
  durationInFrames: number;
  fps: number;
  targetVisibleSeconds?: number;
}): number {
  const targetFrames = Math.min(
    durationInFrames,
    Math.max(1, Math.round(targetVisibleSeconds * Math.max(1, fps))),
  );
  return clampPixelsPerFrame({
    pixelsPerFrame: ppfFromVisibleFrames({
      trackWidth,
      visibleFrames: targetFrames,
    }),
    trackWidth,
    durationInFrames,
    fps,
  });
}

/**
 * Scales pixels-per-frame by a continuous factor, then clamps to fit / max zoom.
 */
export function scalePixelsPerFrame({
  pixelsPerFrame,
  factor,
  trackWidth,
  durationInFrames,
  fps,
}: {
  pixelsPerFrame: number;
  factor: number;
  trackWidth: number;
  durationInFrames: number;
  fps: number;
}): number {
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
  return clampPixelsPerFrame({
    pixelsPerFrame: pixelsPerFrame * safeFactor,
    trackWidth,
    durationInFrames,
    fps,
  });
}

/**
 * Steps zoom toward the next ladder rung (direction: in = smaller window).
 */
export function stepPixelsPerFrame({
  pixelsPerFrame,
  trackWidth,
  durationInFrames,
  fps,
  direction,
}: {
  pixelsPerFrame: number;
  trackWidth: number;
  durationInFrames: number;
  fps: number;
  direction: "in" | "out";
}): number {
  const currentVisible = visibleFramesFromPpf({ pixelsPerFrame, trackWidth });
  const currentSeconds = currentVisible / Math.max(1, fps);
  const ladder = [...TIMELINE_ZOOM_LADDER_SECONDS];

  let targetSeconds: number;
  if (direction === "in") {
    const next = [...ladder].reverse().find((s) => s < currentSeconds - 0.01);
    targetSeconds = next ?? TIMELINE_MIN_VISIBLE_SECONDS;
  } else {
    const next = ladder.find((s) => s > currentSeconds + 0.01);
    targetSeconds = next ?? durationInFrames / Math.max(1, fps);
  }

  const targetFrames = Math.min(
    durationInFrames,
    Math.max(1, Math.round(targetSeconds * Math.max(1, fps))),
  );

  return clampPixelsPerFrame({
    pixelsPerFrame: ppfFromVisibleFrames({
      trackWidth,
      visibleFrames: targetFrames,
    }),
    trackWidth,
    durationInFrames,
    fps,
  });
}

/**
 * Builds candidate major-step sizes in frames for the given fps.
 */
function rulerStepCandidates({ fps }: { fps: number }): number[] {
  const safeFps = Math.max(1, fps);
  const steps = new Set<number>();
  for (const seconds of NICE_SECONDS) {
    const frames = Math.max(1, Math.round(seconds * safeFps));
    steps.add(frames);
  }
  for (const frames of [1, 2, 5, 10, 15, Math.round(safeFps / 2), safeFps]) {
    if (frames >= 1) steps.add(frames);
  }
  return [...steps].sort((a, b) => a - b);
}

/**
 * Picks the largest nice major tick step whose labels stay ≥ min spacing.
 */
export function majorRulerStepFrames({
  pixelsPerFrame,
  fps,
  minTickPx = TIMELINE_MIN_MAJOR_TICK_PX,
}: {
  pixelsPerFrame: number;
  fps: number;
  minTickPx?: number;
}): number {
  const ppf = Math.max(0.0001, pixelsPerFrame);
  const candidates = rulerStepCandidates({ fps });
  let chosen = candidates[candidates.length - 1] ?? Math.max(1, Math.round(fps));

  for (const step of candidates) {
    if (step * ppf >= minTickPx) {
      chosen = step;
      break;
    }
  }

  return chosen;
}

/**
 * Derives the visible frame window from scroll position.
 */
export function viewportFromScroll({
  scrollLeft,
  clientWidth,
  pixelsPerFrame,
  durationInFrames,
}: {
  scrollLeft: number;
  clientWidth: number;
  pixelsPerFrame: number;
  durationInFrames: number;
}): TimelineViewport {
  const ppf = Math.max(0.0001, pixelsPerFrame);
  const startFrame = Math.max(0, scrollLeft / ppf);
  const endFrame = Math.min(
    durationInFrames,
    (scrollLeft + Math.max(1, clientWidth)) / ppf,
  );
  return {
    startFrame: Math.floor(startFrame),
    endFrame: Math.max(Math.ceil(endFrame), Math.floor(startFrame) + 1),
  };
}
