import { spring, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";
import { SceneShell } from "../components/SceneShell";

/**
 * Spring-driven bounce onto the stage (overshoot, then settle).
 */
export default function SpringBounceScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    from: 0.2,
    to: 1,
    config: { damping: 8, stiffness: 120, mass: 0.9 },
  });
  const y = spring({
    frame,
    fps,
    from: 80,
    to: 0,
    config: { damping: 12, stiffness: 100, mass: 1 },
  });

  return (
    <SceneShell
      contentStyle={{
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
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
        }}
      >
        06 — Spring bounce
      </div>

      {/* Bouncing pill */}
      <div
        style={{
          transform: `translateY(${y}px) scale(${scale})`,
          padding: "28px 48px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #f0b429, #f97316)",
          color: "#1a1205",
          fontFamily: "system-ui, sans-serif",
          fontSize: 36,
          fontWeight: 700,
          boxShadow: "0 24px 48px rgba(249, 115, 22, 0.35)",
        }}
      >
        Spring
      </div>
    </SceneShell>
  );
}
