import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";

/**
 * Brand hold during the series-audio lead-in.
 */
export default function LeadIn({ label = "Storyboard" }: { label?: string }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0b1220 0%, #152238 100%)",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Brand mark */}
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.min(width, height) * 0.08,
          color: "#f4f7ff",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}
