import { interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";
import { SceneShell } from "../components/SceneShell";

/**
 * Typewriter-style text reveal driven by the current frame.
 */
export default function TypewriterScene({
  line1 = "Motion should be frame-driven.",
  line2 = "Never wall-clock CSS animation.",
}: {
  line1?: string;
  line2?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars1 = Math.floor(
    interpolate(frame, [8, 8 + line1.length * 1.6], [0, line1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const line2Start = 8 + line1.length * 1.6 + 10;
  const chars2 = Math.floor(
    interpolate(
      frame,
      [line2Start, line2Start + line2.length * 1.6],
      [0, line2.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );

  const cursorOn =
    Math.floor(frame / Math.max(1, Math.round(fps / 4))) % 2 === 0;
  const typingLine2 = chars1 >= line1.length;
  const showCursor1 = !typingLine2 || chars2 < line2.length;
  const showCursor2 = typingLine2;

  return (
    <SceneShell
      contentStyle={{
        justifyContent: "center",
        gap: 28,
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
        }}
      >
        01 — Typewriter
      </div>

      {/* Typed lines */}
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 44,
          lineHeight: 1.35,
          color: "#f2f5fb",
          maxWidth: "16em",
        }}
      >
        <div>
          {line1.slice(0, chars1)}
          {showCursor1 && !typingLine2 ? (
            <span style={{ opacity: cursorOn ? 1 : 0.15 }}>|</span>
          ) : null}
        </div>
        <div style={{ marginTop: 12, color: "#c9d4e8" }}>
          {line2.slice(0, chars2)}
          {showCursor2 ? (
            <span style={{ opacity: cursorOn ? 1 : 0.15 }}>|</span>
          ) : null}
        </div>
      </div>
    </SceneShell>
  );
}
