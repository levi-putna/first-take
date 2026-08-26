import { useEffect, useId } from "react";
import { useVideoConfig } from "@storyboard/core";

export type AudioClipDescriptor = {
  id: string;
  src: string;
  startFromFrame: number;
  durationInFrames?: number;
  loop: boolean;
  /** Volume sample per composition frame (length = durationInFrames of composition). */
  volumePerFrame: number[];
  /** Optional trim into the source media (seconds). */
  mediaStartSeconds?: number;
  /** Optional end trim into the source media (seconds). */
  mediaEndSeconds?: number;
};

type AudioRegistry = {
  clips: Map<string, AudioClipDescriptor>;
};

/**
 * Shared audio registry (also used by Video for source audio mux).
 */
export function getAudioRegistry(): AudioRegistry {
  if (typeof window === "undefined") {
    return { clips: new Map() };
  }
  const w = window as unknown as { __STORYBOARD_AUDIO__?: AudioRegistry };
  if (!w.__STORYBOARD_AUDIO__) {
    w.__STORYBOARD_AUDIO__ = { clips: new Map() };
  }
  return w.__STORYBOARD_AUDIO__;
}

/**
 * Collect registered audio clips for the FFmpeg mux step.
 */
export function collectAudioClips(): AudioClipDescriptor[] {
  return [...getAudioRegistry().clips.values()];
}

/**
 * Clear registered audio clips (between mounts).
 */
export function clearAudioClips(): void {
  getAudioRegistry().clips.clear();
}

/**
 * Build a per-composition-frame volume envelope for a clip.
 */
export function buildVolumePerFrame({
  totalFrames,
  startFromFrame,
  durationInFrames,
  volume,
}: {
  totalFrames: number;
  startFromFrame: number;
  durationInFrames?: number;
  volume: number | ((frame: number) => number);
}): number[] {
  const volumePerFrame: number[] = [];
  for (let f = 0; f < totalFrames; f++) {
    const local = f - startFromFrame;
    if (local < 0) {
      volumePerFrame.push(0);
      continue;
    }
    if (durationInFrames !== undefined && local >= durationInFrames) {
      volumePerFrame.push(0);
      continue;
    }
    const v = typeof volume === "function" ? volume(local) : volume;
    volumePerFrame.push(Math.max(0, v));
  }
  return volumePerFrame;
}

/**
 * Registers an audio layer for encode-time muxing. Does not play HTML audio during render.
 * Registration happens synchronously during render so capture can collect clips immediately.
 */
export function Audio({
  src,
  startFromFrame = 0,
  durationInFrames,
  loop = false,
  volume = 1,
}: {
  src: string;
  startFromFrame?: number;
  durationInFrames?: number;
  loop?: boolean;
  volume?: number | ((frame: number) => number);
}) {
  const id = useId();
  const { durationInFrames: totalFrames } = useVideoConfig();

  // Synchronous registration (must run during render, not only in effects)
  getAudioRegistry().clips.set(id, {
    id,
    src,
    startFromFrame,
    durationInFrames,
    loop,
    volumePerFrame: buildVolumePerFrame({
      totalFrames,
      startFromFrame,
      durationInFrames,
      volume,
    }),
  });

  useEffect(() => {
    return () => {
      getAudioRegistry().clips.delete(id);
    };
  }, [id]);

  return null;
}
