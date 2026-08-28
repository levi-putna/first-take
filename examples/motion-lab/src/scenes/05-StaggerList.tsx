import { interpolate, useCurrentFrame, useVideoConfig } from "first-take";
import { SceneShell } from "../components/SceneShell";

const ITEMS = [
  "Interpolate ranges",
  "Spring physics",
  "Sequence offsets",
  "Fade overlaps",
];

/**
 * Staggered list items fade and rise in one after another.
 */
export default function StaggerListScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneShell contentStyle={{ justifyContent: "center", gap: 28 }}>
      {/* Scene label */}
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 14,
          color: "#7dd3fc",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        05 — Stagger list
      </div>

      {/* Staggered rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ITEMS.map((label, index) => {
          const start = 6 + index * Math.round(0.28 * fps);
          const opacity = interpolate(frame, [start, start + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [start, start + 14], [18, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={label}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 20px",
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                minWidth: 420,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#3d8bfd",
                }}
              />
              <span
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 28,
                  color: "#e8eef8",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}
