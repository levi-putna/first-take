import { AbsoluteFill, interpolate, useCurrentFrame, useSequenceDuration, useVideoConfig } from "first-take";
import { Audio, staticFile } from "first-take/media";

/**
 * Brand hold during the opening bumper, with an optional jingle.
 */
export default function LeadIn({
  label = "Storyboard",
  jingle,
  jingleVolume = 0.55,
  jingleFadeOutSeconds = 0.6,
}: {
  label?: string;
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

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0b1220 0%, #152238 100%)",
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
