import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { theme } from "../components/theme";

/**
 * Closing land: you stay the director.
 */
export default function LandScene({
  headline = "You stay the director.",
  support = "Revisions are edits, not regenerate and hope.",
  command = "",
}: {
  headline?: string;
  support?: string;
  command?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.45 * fps], [18, 0], {
    extrapolateRight: "clamp",
  });
  const commandOpacity = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
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
      {/* Close */}
      <div style={{ transform: `translateY(${y}px)`, opacity }}>
        <div
          style={{
            color: theme.white,
            fontFamily: theme.fontDisplay,
            fontWeight: 700,
            fontSize: Math.max(36, width * 0.048),
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            marginBottom: height * 0.03,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: theme.magentaSoft,
            fontFamily: theme.fontBody,
            fontSize: Math.max(20, width * 0.022),
            lineHeight: 1.4,
            maxWidth: "22em",
          }}
        >
          {support}
        </div>
      </div>

      {/* Closing line */}
      {command ? (
        <div
          style={{
            opacity: commandOpacity,
            marginTop: height * 0.08,
            display: "inline-flex",
            alignSelf: "flex-start",
            backgroundColor: theme.plumMid,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusSm,
            padding: `${height * 0.02}px ${width * 0.024}px`,
            color: theme.white,
            fontFamily: theme.fontMono,
            fontSize: Math.max(18, width * 0.02),
          }}
        >
          {command}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
