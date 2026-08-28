import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "first-take";

/** Animated title card for First Take lead-in / outro scenes. */
export default function TitleCard({
  headline = "First Take",
  subtitle = "",
}: {
  headline?: string;
  subtitle?: string;
}) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const opacity = interpolate(frame, [0, 15, 60, 75], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 20], [24, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 30% 20%, #2a1b4a 0%, #0b0b10 60%)",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ transform: `translateY(${y}px)`, textAlign: "center", padding: 40 }}>
        <div
          style={{
            color: "#fff",
            fontSize: Math.max(36, width * 0.05),
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          {headline}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 16,
              color: "rgba(255,255,255,0.75)",
              fontSize: Math.max(16, width * 0.02),
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
