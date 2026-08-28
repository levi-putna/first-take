import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useSequenceDuration,
  useVideoConfig,
} from "first-take";
import { theme } from "../components/theme";

const STEPS = ["Validate", "Still", "Preview", "Render"] as const;

/**
 * Closed CLI loop, fading out into the live studio beat.
 */
export default function LoopScene({
  headline = "Same files. Same pixels. Every time.",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const duration = useSequenceDuration() ?? Math.round(18 * fps);
  const fadeOut = interpolate(
    frame,
    [duration - 15, duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const titleOpacity = interpolate(frame, [0, 0.35 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.plum,
        justifyContent: "center",
        padding: width * 0.08,
        opacity: fadeOut,
      }}
    >
      {/* Headline */}
      <div
        style={{
          opacity: titleOpacity,
          color: theme.white,
          fontFamily: theme.fontDisplay,
          fontWeight: 700,
          fontSize: Math.max(28, width * 0.034),
          lineHeight: 1.2,
          marginBottom: height * 0.08,
          letterSpacing: "-0.02em",
        }}
      >
        {headline}
      </div>

      {/* Loop steps */}
      <div style={{ display: "flex", alignItems: "center", gap: width * 0.016 }}>
        {STEPS.map((step, index) => {
          const appearAt = (0.45 + index * 0.28) * fps;
          const opacity = interpolate(
            frame,
            [appearAt, appearAt + 0.3 * fps],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const active =
            frame >= appearAt + 0.15 * fps
              ? 1
              : interpolate(frame, [appearAt, appearAt + 0.15 * fps], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: width * 0.016 }}>
              <div
                style={{
                  opacity,
                  backgroundColor:
                    active > 0.5 ? theme.magenta : theme.plumMid,
                  color: active > 0.5 ? theme.white : theme.magentaSoft,
                  fontFamily: theme.fontMono,
                  fontSize: Math.max(16, width * 0.018),
                  padding: `${height * 0.018}px ${width * 0.018}px`,
                  borderRadius: theme.radiusSm,
                  border: `1px solid ${active > 0.5 ? theme.magenta : theme.border}`,
                }}
              >
                {step}
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  style={{
                    opacity,
                    width: width * 0.03,
                    height: 2,
                    backgroundColor: theme.magenta,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
