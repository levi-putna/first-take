import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useSequenceDuration,
  useVideoConfig,
} from "first-take";
import type { CSSProperties, ReactNode } from "react";
import { FrameTimeline, TIMELINE_HEIGHT } from "./FrameTimeline";

/**
 * Scene chrome: background, padded content area, and the shared frame timeline.
 */
export function SceneShell({
  children,
  background = "#0b1220",
  contentStyle,
  opacity = 1,
}: {
  children: ReactNode;
  background?: string;
  contentStyle?: CSSProperties;
  /** Whole-scene opacity for cross-track fades. */
  opacity?: number;
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: background, opacity }}>
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

/**
 * Opacity envelope for overlay-track scenes that crossfade with the main lane.
 */
export function useCrossfadeOpacity({
  fadeFrames = 12,
}: {
  fadeFrames?: number;
} = {}): number {
  const frame = useCurrentFrame();
  const durationInFrames = useSequenceDuration() ?? useVideoConfig().durationInFrames;
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fadeFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return Math.min(fadeIn, fadeOut);
}
