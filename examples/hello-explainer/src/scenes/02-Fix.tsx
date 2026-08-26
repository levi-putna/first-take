import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";

/**
 * Payoff scene — focus ring emphasis.
 */
export default function FixScene({
  headline = "Focus rings make the path obvious.",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ring = interpolate(frame, [0.2 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0e1524",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: width * 0.08,
      }}
    >
      {/* Mock button with focus ring */}
      <div
        style={{
          position: "relative",
          padding: "18px 36px",
          borderRadius: 12,
          background: "#1e3a5f",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontSize: 28,
          boxShadow: `0 0 0 ${4 + ring * 4}px rgba(61, 139, 253, ${0.35 + ring * 0.45})`,
        }}
      >
        Continue
      </div>

      {/* Supporting line */}
      <div
        style={{
          opacity,
          color: "#d7deed",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(28, width * 0.035),
          textAlign: "center",
          maxWidth: "16em",
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  );
}
