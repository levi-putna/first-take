import { interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";
import { SceneShell } from "../components/SceneShell";

/**
 * Circle that expands and contracts on a smooth sine pulse.
 */
export default function PulseCircleScene() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 1.1);
  const scale = interpolate(pulse, [0, 1], [0.35, 1.15]);
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const size = Math.min(width, height) * 0.38;

  return (
    <SceneShell
      contentStyle={{
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
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
        03 — Pulse circle
      </div>

      {/* Pulsing disc */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 30%, #7dd3fc 0%, #3d8bfd 45%, #1e3a5f 100%)",
          transform: `scale(${scale})`,
          opacity,
          boxShadow: `0 0 ${40 + pulse * 60}px rgba(61, 139, 253, ${0.25 + pulse * 0.35})`,
        }}
      />
    </SceneShell>
  );
}
