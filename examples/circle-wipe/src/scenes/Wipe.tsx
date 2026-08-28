import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useSequenceDuration,
  useVideoConfig,
} from "first-take";

/**
 * Convert a millisecond hold into whole frames, leaving at least one frame
 * to close and one frame to open.
 */
function pauseFramesFromMs({
  pauseMs,
  fps,
  durationInFrames,
}: {
  pauseMs: number;
  fps: number;
  durationInFrames: number;
}): number {
  const requested = Math.max(0, Math.round((pauseMs / 1000) * fps));
  const maxPause = Math.max(0, durationInFrames - 2);
  return Math.min(requested, maxPause);
}

/**
 * Circular hole radius for a close → hold → open iris.
 */
function holeRadiusAtFrame({
  frame,
  coverRadius,
  durationInFrames,
  pauseFrames,
}: {
  frame: number;
  coverRadius: number;
  durationInFrames: number;
  pauseFrames: number;
}): number {
  const lastFrame = durationInFrames - 1;
  const motionFrames = durationInFrames - pauseFrames;
  const closeFrames = Math.floor(motionFrames / 2);
  const closeEnd = closeFrames - 1;
  const openStart = closeFrames + pauseFrames;

  if (frame <= closeEnd) {
    return interpolate(frame, [0, closeEnd], [coverRadius, 0], {
      extrapolateRight: "clamp",
    });
  }

  if (frame < openStart) {
    return 0;
  }

  return interpolate(frame, [openStart, lastFrame], [0, coverRadius], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Iris wipe: black closes to a centre point, holds, then opens fully back out.
 * `pauseMs` is how long to stay fully closed before zooming back out.
 * Start and end states match — overlay is fully transparent (large hole).
 */
export default function Wipe({
  pauseMs = 0,
}: {
  pauseMs?: number;
}) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const durationInFrames = useSequenceDuration() ?? 90;
  const cx = width / 2;
  const cy = height / 2;
  /** Cover corners when the hole is fully open. */
  const coverRadius = Math.hypot(width / 2, height / 2) * 1.02;
  const pauseFrames = pauseFramesFromMs({
    pauseMs,
    fps,
    durationInFrames,
  });
  const holeRadius = holeRadiusAtFrame({
    frame,
    coverRadius,
    durationInFrames,
    pauseFrames,
  });

  const maskId = "circle-wipe-mask";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Black overlay with a circular hole */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block" }}
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            <rect width={width} height={height} fill="white" />
            <circle cx={cx} cy={cy} r={holeRadius} fill="black" />
          </mask>
        </defs>
        <rect
          width={width}
          height={height}
          fill="#000000"
          mask={`url(#${maskId})`}
        />
      </svg>
    </AbsoluteFill>
  );
}
