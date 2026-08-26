import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";

/**
 * Opening hook scene — headline fades in.
 */
export default function HookScene({
  headline = "You hit Tab. Nothing highlights.",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.5 * fps], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0e1524",
        alignItems: "center",
        justifyContent: "center",
        padding: width * 0.08,
      }}
    >
      {/* Headline */}
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          color: "#f2f5fb",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(36, width * 0.045),
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: "18em",
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  );
}
