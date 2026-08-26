import { interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";
import { SceneShell } from "../components/SceneShell";

/**
 * Continuous rotation plus an animated numeric counter.
 */
export default function RotateCounterScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rotation = interpolate(frame, [0, 3 * fps], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });
  const count = Math.floor(
    interpolate(frame, [0, 2.5 * fps], [0, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      contentStyle={{
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 56,
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 14,
          color: "#7dd3fc",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity,
        }}
      >
        08 — Rotate + counter
      </div>

      {/* Rotating square */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          background: "linear-gradient(135deg, #a78bfa, #3d8bfd)",
          transform: `rotate(${rotation}deg)`,
          opacity,
          boxShadow: "0 20px 48px rgba(61, 139, 253, 0.35)",
        }}
      />

      {/* Counter */}
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 64,
          color: "#f2f5fb",
          opacity,
          letterSpacing: "0.04em",
        }}
      >
        {String(count).padStart(3, "0")}
      </div>
    </SceneShell>
  );
}
