import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { theme } from "../components/theme";

/**
 * Opening hook: a clip versus a project you can actually edit.
 */
export default function HookScene({
  eyebrow = "The other half of the job",
  headline = "Most AI video tools give you a clip.",
  support = "First Take gives you a project you can edit.",
}: {
  eyebrow?: string;
  headline?: string;
  support?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const kickerOpacity = interpolate(frame, [0, 0.35 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(frame, [0.15 * fps, 0.55 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [0.15 * fps, 0.55 * fps], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const supportOpacity = interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.plum,
        justifyContent: "center",
        padding: width * 0.08,
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          opacity: kickerOpacity,
          color: theme.magenta,
          fontFamily: theme.fontBody,
          fontWeight: 600,
          fontSize: Math.max(12, width * 0.012),
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: height * 0.03,
        }}
      >
        {eyebrow}
      </div>

      {/* Headline */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          color: theme.white,
          fontFamily: theme.fontDisplay,
          fontWeight: 700,
          fontSize: Math.max(36, width * 0.048),
          lineHeight: 1.15,
          maxWidth: "16em",
          letterSpacing: "-0.02em",
        }}
      >
        {headline}
      </div>

      {/* Support line */}
      <div
        style={{
          opacity: supportOpacity,
          marginTop: height * 0.04,
          color: theme.magentaSoft,
          fontFamily: theme.fontBody,
          fontSize: Math.max(20, width * 0.022),
          lineHeight: 1.4,
          maxWidth: "22em",
        }}
      >
        {support}
      </div>
    </AbsoluteFill>
  );
}
