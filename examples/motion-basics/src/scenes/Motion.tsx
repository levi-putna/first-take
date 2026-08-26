import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

/**
 * Frame-driven opacity and scale for golden motion checks (no text).
 */
export default function Motion() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Animated block */}
      <div
        style={{
          width: 120,
          height: 120,
          backgroundColor: "#ffcc00",
          opacity,
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
}
