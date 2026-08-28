import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { theme } from "../components/theme";

const LAYERS = [
  { title: "React scenes", detail: "Every shot is a component." },
  { title: "JSON timeline", detail: "Every cut is data." },
  { title: "MP4 output", detail: "A file you can actually revise." },
] as const;

/**
 * Three-layer mental model: scenes, timeline, output.
 */
export default function ConceptScene({
  headline = "Not an AI. An editor your agents already know.",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const cardWidth = Math.min(width * 0.26, 360);
  const gap = width * 0.024;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.plum,
        justifyContent: "center",
        padding: width * 0.08,
      }}
    >
      {/* Headline */}
      <div
        style={{
          opacity: titleOpacity,
          color: theme.white,
          fontFamily: theme.fontDisplay,
          fontWeight: 700,
          fontSize: Math.max(28, width * 0.032),
          lineHeight: 1.2,
          maxWidth: "18em",
          marginBottom: height * 0.08,
          letterSpacing: "-0.02em",
        }}
      >
        {headline}
      </div>

      {/* Layer cards */}
      <div style={{ display: "flex", gap, alignItems: "stretch" }}>
        {LAYERS.map((layer, index) => {
          const appearAt = (0.55 + index * 0.35) * fps;
          const opacity = interpolate(
            frame,
            [appearAt, appearAt + 0.4 * fps],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const y = interpolate(
            frame,
            [appearAt, appearAt + 0.4 * fps],
            [18, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={layer.title}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
                width: cardWidth,
                backgroundColor: theme.plumMid,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radiusSm,
                padding: width * 0.022,
              }}
            >
              <div
                style={{
                  color: theme.magenta,
                  fontFamily: theme.fontBody,
                  fontWeight: 600,
                  fontSize: Math.max(12, width * 0.012),
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  color: theme.white,
                  fontFamily: theme.fontDisplay,
                  fontWeight: 700,
                  fontSize: Math.max(20, width * 0.022),
                  marginBottom: 10,
                }}
              >
                {layer.title}
              </div>
              <div
                style={{
                  color: theme.magentaSoft,
                  fontFamily: theme.fontBody,
                  fontSize: Math.max(14, width * 0.016),
                  lineHeight: 1.4,
                }}
              >
                {layer.detail}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
