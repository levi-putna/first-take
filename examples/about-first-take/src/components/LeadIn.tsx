import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useSequenceDuration,
  useVideoConfig,
} from "first-take";
import { Audio, Img, staticFile } from "first-take/media";
import { theme } from "./theme";

/**
 * Brand hold during the opening bumper, with an optional jingle.
 */
export default function LeadIn({
  label = "First Take",
  subtitle = "Explainer videos you can edit, not just generate.",
  logo = "assets/img/logo-white.svg",
  jingle,
  jingleVolume = 0.55,
  jingleFadeOutSeconds = 0.6,
}: {
  label?: string;
  subtitle?: string;
  logo?: string;
  jingle?: string;
  jingleVolume?: number;
  jingleFadeOutSeconds?: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const sequenceDuration = useSequenceDuration() ?? 120;
  const fadeFrames = Math.max(1, Math.round(jingleFadeOutSeconds * fps));
  const opacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.45 * fps], [20, 0], {
    extrapolateRight: "clamp",
  });
  const markSize = Math.round(Math.min(width, height) * 0.14);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.plum,
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {jingle ? (
        <Audio
          src={staticFile(jingle)}
          volume={(localFrame) =>
            interpolate(
              localFrame,
              [sequenceDuration - fadeFrames, sequenceDuration],
              [jingleVolume, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      ) : null}

      {/* Brand lockup */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${y}px)`,
          padding: width * 0.08,
          textAlign: "center",
        }}
      >
        <Img
          src={staticFile(logo)}
          style={{
            width: markSize,
            height: markSize,
            borderRadius: theme.radiusSm,
            marginBottom: height * 0.04,
          }}
        />
        <div
          style={{
            fontFamily: theme.fontDisplay,
            fontWeight: 700,
            fontSize: Math.min(width, height) * 0.07,
            color: theme.white,
            letterSpacing: "-0.02em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: height * 0.018,
            fontFamily: theme.fontBody,
            fontSize: Math.max(16, width * 0.018),
            color: theme.magentaSoft,
            maxWidth: "22em",
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
