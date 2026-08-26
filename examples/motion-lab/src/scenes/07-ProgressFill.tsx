import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@storyboard/core";
import { SceneShell } from "../components/SceneShell";

/**
 * Horizontal progress bar that fills over the scene duration.
 */
export default function ProgressFillScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [10, 10 + 2.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell contentStyle={{ justifyContent: "center", gap: 36 }}>
      {/* Scene label */}
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 14,
          color: "#7dd3fc",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: labelOpacity,
        }}
      >
        07 — Progress fill
      </div>

      {/* Percent readout */}
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 56,
          color: "#f2f5fb",
          opacity: labelOpacity,
        }}
      >
        {Math.round(progress * 100)}%
      </div>

      {/* Track */}
      <div
        style={{
          width: "70%",
          maxWidth: 720,
          height: 18,
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, #22c55e, #86efac)",
          }}
        />
      </div>
    </SceneShell>
  );
}
