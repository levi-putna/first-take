import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

/**
 * Second transparent lower-third, after a gap on the overlay track.
 */
export default function OverlayB({
  headline = "Second callout",
  detail = "Another gap, then this overlay.",
}: {
  headline?: string;
  detail?: string;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const barHeight = Math.round(height * 0.22);
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Lower-third bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: barHeight,
          padding: `0 ${width * 0.06}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(90deg, rgba(140, 70, 30, 0.92) 0%, rgba(140, 70, 30, 0.5) 100%)",
          opacity,
        }}
      >
        <div
          style={{
            color: "#fff6ee",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: Math.max(22, width * 0.028),
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 6,
            color: "rgba(255, 236, 220, 0.8)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: Math.max(14, width * 0.016),
          }}
        >
          {detail}
        </div>
      </div>
    </AbsoluteFill>
  );
}
