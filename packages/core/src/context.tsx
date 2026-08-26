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

type FrameContextValue = {
  /** Absolute composition frame (0-indexed). */
  absoluteFrame: number;
  /** Frame relative to the nearest Sequence boundary. */
  frame: number;
};

type ConfigContextValue = {
  config: VideoConfig;
};

const FrameContext = createContext<FrameContextValue | null>(null);
const ConfigContext = createContext<ConfigContextValue | null>(null);

/**
 * Root provider that injects absolute frame and video config.
 */
export function StoryboardProvider({
  frame,
  config,
  children,
}: {
  frame: number;
  config: VideoConfig;
  children: ReactNode;
}) {
  return (
    <ConfigContext.Provider value={{ config }}>
      <FrameContext.Provider value={{ absoluteFrame: frame, frame }}>
        {children}
      </FrameContext.Provider>
    </ConfigContext.Provider>
  );
}

/**
 * Override local frame for Sequence children (keeps absoluteFrame).
 */
export function FrameOffsetProvider({
  absoluteFrame,
  localFrame,
  children,
}: {
  absoluteFrame: number;
  localFrame: number;
  children: ReactNode;
}) {
  return (
    <FrameContext.Provider value={{ absoluteFrame, frame: localFrame }}>
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
 * Active composition metadata.
 */
export function useVideoConfig(): VideoConfig {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useVideoConfig() must be used inside StoryboardProvider");
  }
  return ctx.config;
}
