import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

/**
 * Composition metadata for the active render or preview.
 */
export type VideoConfig = {
  id: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
};

/**
 * Preview transport. Capture omits this so audio stays silent.
 */
export type PlaybackState = {
  playing: boolean;
  muted: boolean;
};

type FrameContextValue = {
  /** Absolute composition frame (0-indexed). */
  absoluteFrame: number;
  /** Frame relative to the nearest Sequence boundary. */
  frame: number;
  /** Duration of the enclosing Sequence, if bounded. */
  sequenceDurationInFrames?: number;
};

type ConfigContextValue = {
  config: VideoConfig;
};

const FrameContext = createContext<FrameContextValue | null>(null);
const ConfigContext = createContext<ConfigContextValue | null>(null);
const PlaybackContext = createContext<PlaybackState>({
  playing: false,
  muted: true,
});

/**
 * Root provider that injects absolute frame and video config.
 */
export function StoryboardProvider({
  frame,
  config,
  playing = false,
  muted = true,
  children,
}: {
  frame: number;
  config: VideoConfig;
  playing?: boolean;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <ConfigContext.Provider value={{ config }}>
      <PlaybackContext.Provider value={{ playing, muted }}>
        <FrameContext.Provider
          value={{
            absoluteFrame: frame,
            frame,
            sequenceDurationInFrames: config.durationInFrames,
          }}
        >
          {children}
        </FrameContext.Provider>
      </PlaybackContext.Provider>
    </ConfigContext.Provider>
  );
}

/**
 * Override local frame for Sequence children (keeps absoluteFrame).
 */
export function FrameOffsetProvider({
  absoluteFrame,
  localFrame,
  sequenceDurationInFrames,
  children,
}: {
  absoluteFrame: number;
  localFrame: number;
  sequenceDurationInFrames?: number;
  children: ReactNode;
}) {
  return (
    <FrameContext.Provider
      value={{ absoluteFrame, frame: localFrame, sequenceDurationInFrames }}
    >
      {children}
    </FrameContext.Provider>
  );
}

/**
 * Current frame relative to the nearest Sequence (or absolute at root).
 */
export function useCurrentFrame(): number {
  const ctx = useContext(FrameContext);
  if (!ctx) {
    throw new Error("useCurrentFrame() must be used inside StoryboardProvider");
  }
  return ctx.frame;
}

/**
 * Absolute composition frame (ignores Sequence offsets).
 */
export function useAbsoluteFrame(): number {
  const ctx = useContext(FrameContext);
  if (!ctx) {
    throw new Error("useAbsoluteFrame() must be used inside StoryboardProvider");
  }
  return ctx.absoluteFrame;
}

/**
 * Duration of the enclosing Sequence (composition length at the root).
 */
export function useSequenceDuration(): number | undefined {
  const ctx = useContext(FrameContext);
  if (!ctx) {
    throw new Error(
      "useSequenceDuration() must be used inside StoryboardProvider",
    );
  }
  return ctx.sequenceDurationInFrames;
}

/**
 * Preview transport. Capture stays muted and paused by default.
 */
export function usePlayback(): PlaybackState {
  return useContext(PlaybackContext);
}

/**
 * Active composition metadata.
 */
export function useVideoConfig(): VideoConfig {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useVideoConfig() must be used inside StoryboardProvider");
  }
  return ctx.config;
}
