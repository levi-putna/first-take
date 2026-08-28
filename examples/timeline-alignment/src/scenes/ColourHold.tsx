import { AbsoluteFill, useVideoConfig } from "first-take";
import { formatClock } from "../formatClock";

/**
 * Opaque colour hold for one 10-second block on the background track.
 */
export default function ColourHold({
  colour = "#c0392b",
  startSecond = 0,
  durationSeconds = 10,
}: {
  colour?: string;
  startSecond?: number;
  durationSeconds?: number;
}) {
  const { width, height } = useVideoConfig();
  const startLabel = formatClock({ totalSeconds: startSecond });
  const endLabel = formatClock({ totalSeconds: startSecond + durationSeconds });
  const sceneNumber = Math.floor(startSecond / durationSeconds) + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: colour }}>
      {/* Block identity — expected 10-second window for this clip */}
      <div
        style={{
          position: "absolute",
          left: width * 0.06,
          bottom: height * 0.08,
          color: "#ffffff",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textShadow: "0 2px 12px rgba(0, 0, 0, 0.55)",
        }}
      >
        <div
          style={{
            fontSize: Math.max(14, width * 0.016),
            letterSpacing: "0.14em",
            opacity: 0.85,
            textTransform: "uppercase",
          }}
        >
          Scene {String(sceneNumber).padStart(2, "0")}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: Math.max(28, width * 0.042),
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {startLabel} - {endLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
}
