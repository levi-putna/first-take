import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useSequenceDuration,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

/**
 * Iris wipe: black closes to a centre point, then opens fully back out.
 * Start and end states match — overlay is fully transparent (large hole).
 */
export default function Wipe() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const durationInFrames = useSequenceDuration() ?? 90;
  const cx = width / 2;
  const cy = height / 2;
  /** Cover corners when the hole is fully open. */
  const coverRadius = Math.hypot(width / 2, height / 2) * 1.02;
  const closeEnd = Math.floor(durationInFrames / 2) - 1;
  const openStart = closeEnd + 1;
  const lastFrame = durationInFrames - 1;

  const holeRadius =
    frame <= closeEnd
      ? interpolate(frame, [0, closeEnd], [coverRadius, 0], {
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [openStart, lastFrame], [0, coverRadius], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
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
