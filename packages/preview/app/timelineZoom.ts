/**
 * Timeline zoom helpers: fit/clamp ppf, visible span, and ruler tick steps.
 * Zoom is modelled as pixels per composition frame.
 */

/** Maximum pixels per frame when zoomed all the way in. */
export const TIMELINE_MAX_PIXELS_PER_FRAME = 80;

/** Minimum major-tick spacing in pixels before the ruler steps up. */
export const TIMELINE_MIN_MAJOR_TICK_PX = 64;

/** Preferred opening window when the piece is longer than this (seconds). */
export const TIMELINE_DEFAULT_VISIBLE_SECONDS = 45;

/** Minimum visible duration when zoomed in (seconds). */
export const TIMELINE_MIN_VISIBLE_SECONDS = 0.25;

/**
 * Trailing gutter is a share of the visible track, not a fixed frame count.
 * Only enough empty pixels to land the trim handle; zoom still changes
 * how many frames that represents.
 */
export const TIMELINE_TAIL_GUTTER_VIEWPORT_FRACTION = 0.01;

/** Smallest gutter that still clears the trim handle plus a little slack. */
export const TIMELINE_TAIL_GUTTER_MIN_PX = 20;

/** Pointer distance from the scrollport edge that starts trim auto-scroll. */
export const TIMELINE_TRIM_EDGE_ZONE_PX = 48;

/** Fastest auto-scroll while the pointer sits in the edge zone (px per frame). */
export const TIMELINE_TRIM_EDGE_MAX_STEP_PX = 14;

const NICE_SECONDS = [
  0.025,
  0.05,
  1 / 30,
  0.1,
  2 / 30,
  0.25,
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
  0.25, 0.5, 1, 2, 5, 10, 15, 30, 45, 60, 120, 300, 600, 900, 1800, 3600, 7200,
] as const;

export type TimelineViewport = {
  startFrame: number;
  endFrame: number;
};

/**
 * Trailing scroll gutter in pixels for the current visible track.
 *
 * Sized from the viewport (then converted to frames by zoom) so a tight zoom
 * does not leave a huge empty region and a wide zoom still has a grab target.
 */
export function tailGutterPx({
  trackWidth,
}: {
  trackWidth: number;
}): number {
  const width = Math.max(0, trackWidth);
  const fromViewport = width * TIMELINE_TAIL_GUTTER_VIEWPORT_FRACTION;
  return Math.round(Math.max(TIMELINE_TAIL_GUTTER_MIN_PX, fromViewport));
}

/**
 * Frame count represented by the trailing gutter at the current zoom.
 */
export function tailGutterFrames({
  trackWidth,
  pixelsPerFrame,
}: {
  trackWidth: number;
  pixelsPerFrame: number;
}): number {
  const ppf = Math.max(0.0001, pixelsPerFrame);
  return tailGutterPx({ trackWidth }) / ppf;
}

/**
 * Scrollable stack width: composition pixels plus the trailing gutter.
 */
export function timelineContentWidth({
  durationInFrames,
  pixelsPerFrame,
  trackWidth,
}: {
  durationInFrames: number;
  pixelsPerFrame: number;
  trackWidth: number;
}): number {
  const ppf = Math.max(0.0001, pixelsPerFrame);
  return Math.max(0, durationInFrames) * ppf + tailGutterPx({ trackWidth });
}

/**
 * Composition length plus the trailing gutter, in frames at the current zoom.
 * Used for pan/scroll so the last trim handle can sit inside the viewport.
 */
export function scrollableDurationInFrames({
  durationInFrames,
  trackWidth,
  pixelsPerFrame,
}: {
  durationInFrames: number;
  trackWidth: number;
  pixelsPerFrame: number;
}): number {
  return (
    Math.max(0, durationInFrames) +
    tailGutterFrames({ trackWidth, pixelsPerFrame })
  );
}

/**
 * Pixels per frame that fits the composition plus trailing gutter.
 */
export function fitPixelsPerFrame({
  trackWidth,
  durationInFrames,
}: {
  trackWidth: number;
  durationInFrames: number;
}): number {
  const gutter = tailGutterPx({ trackWidth });
  const width = Math.max(1, trackWidth - gutter);
  const duration = Math.max(1, durationInFrames);
  return width / duration;
}

/**
 * How far to auto-scroll this frame while trimming near a scrollport edge.
 * Speed ramps as the pointer approaches the edge; past the edge it keeps going.
 */
export function trimEdgeScrollDeltaPx({
  clientX,
  viewportLeft,
  viewportRight,
  zonePx = TIMELINE_TRIM_EDGE_ZONE_PX,
  maxStepPx = TIMELINE_TRIM_EDGE_MAX_STEP_PX,
}: {
  clientX: number;
  viewportLeft: number;
  viewportRight: number;
  zonePx?: number;
  maxStepPx?: number;
}): number {
  const zone = Math.max(1, zonePx);
  const maxStep = Math.max(0, maxStepPx);

  if (clientX >= viewportRight - zone) {
    if (clientX >= viewportRight) {
      return maxStep + Math.min(20, (clientX - viewportRight) * 0.15);
    }
    const strength = Math.min(1, Math.max(0, (clientX - (viewportRight - zone)) / zone));
    return strength ** 2 * maxStep;
  }

  if (clientX <= viewportLeft + zone) {
    if (clientX <= viewportLeft) {
      return -(maxStep + Math.min(20, (viewportLeft - clientX) * 0.15));
    }
    const strength = Math.min(1, Math.max(0, (viewportLeft + zone - clientX) / zone));
    return -(strength ** 2 * maxStep);
  }

  return 0;
}

/**
 * Trim-end duration from the pointer's position in the scrollable timeline.
 * Scroll is included here, so edge auto-scroll must not add a second delta.
 */
export function durationFromTrimPointer({
  clientX,
  viewportLeft,
  viewportWidth,
  scrollLeft,
  pixelsPerFrame,
  startFrame,
}: {
  clientX: number;
  viewportLeft: number;
  viewportWidth: number;
  scrollLeft: number;
  pixelsPerFrame: number;
  startFrame: number;
}): number {
  const ppf = Math.max(0.0001, pixelsPerFrame);
  const width = Math.max(1, viewportWidth);
  const localX = Math.min(Math.max(0, clientX - viewportLeft), width);
  const endFrame = Math.round((scrollLeft + localX) / ppf);
  return Math.max(1, endFrame - startFrame);
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
  const requestedPpf =
    targetFrames >= durationInFrames
      ? fitPixelsPerFrame({ trackWidth, durationInFrames })
      : ppfFromVisibleFrames({
          trackWidth,
          visibleFrames: targetFrames,
        });
  return clampPixelsPerFrame({
    pixelsPerFrame: requestedPpf,
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
 * `durationInFrames` is the scrollable max (composition plus trailing gutter).
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
