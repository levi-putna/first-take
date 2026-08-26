import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "@levi-putna/storyboard-core";
import { FrameTimeline, TIMELINE_HEIGHT } from "./FrameTimeline";

/**
 * Scene chrome: background, padded content area, and the shared frame timeline.
 */
export function SceneShell({
  children,
  background = "#0b1220",
  contentStyle,
}: {
  children: ReactNode;
  background?: string;
  contentStyle?: CSSProperties;
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {/* Scene content — leave room for the timeline strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: TIMELINE_HEIGHT,
          padding: "48px 56px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          ...contentStyle,
        }}
      >
        {children}
      </div>

      {/* Timing strip — same on every scene */}
      <FrameTimeline />
    </AbsoluteFill>
  );
}
