import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@storyboard/core";
import { SceneShell } from "../components/SceneShell";

/**
 * Panel slides in from the left while fading up.
 */
export default function SlideFadeScene({
  headline = "Slide in from the left",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const x = interpolate(frame, [0, 0.7 * fps], [-width * 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      contentStyle={{
        justifyContent: "center",
        gap: 24,
      }}
    >
      {/* Scene label */}
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 14,
          color: "#7dd3fc",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity,
        }}
      >
        04 — Slide + fade
      </div>

      {/* Sliding card */}
      <div
        style={{
          transform: `translateX(${x}px)`,
          opacity,
          padding: "36px 44px",
          borderRadius: 20,
          backgroundColor: "rgba(30, 58, 95, 0.85)",
          border: "1px solid rgba(125, 211, 252, 0.25)",
          maxWidth: "18em",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 40,
            color: "#f2f5fb",
            lineHeight: 1.3,
          }}
        >
          {headline}
        </div>
      </div>
    </SceneShell>
  );
}
