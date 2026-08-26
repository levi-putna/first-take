import { useEffect, useId, useRef } from "react";
import {
  useAbsoluteFrame,
  useCurrentFrame,
  usePlayback,
  useSequenceDuration,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

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

const DRIFT_SECONDS = 0.45;

/**
 * Registers an audio layer for encode-time muxing.
 * In preview, also plays a hidden HTML audio element when the transport is playing.
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
  const frame = useCurrentFrame();
  const absoluteFrame = useAbsoluteFrame();
  const sequenceDuration = useSequenceDuration();
  const { durationInFrames: totalFrames, fps } = useVideoConfig();
  const playback = usePlayback();

  const compositionStartFrame = absoluteFrame - frame;
  const clipStart = compositionStartFrame + startFromFrame;
  const remainingSequence =
    sequenceDuration === undefined
      ? undefined
      : Math.max(1, sequenceDuration - startFromFrame);
  const clipDuration = durationInFrames ?? remainingSequence;

  // Synchronous registration (must run during render, not only in effects)
  getAudioRegistry().clips.set(id, {
    id,
    src,
    startFromFrame: clipStart,
    durationInFrames: clipDuration,
    loop,
    volumePerFrame: buildVolumePerFrame({
      totalFrames,
      startFromFrame: clipStart,
      durationInFrames: clipDuration,
      volume,
    }),
  });

  useEffect(() => {
    return () => {
      getAudioRegistry().clips.delete(id);
    };
  }, [id]);

  const enableHtml = playback.playing || !playback.muted;
  const clipLocal = frame - startFromFrame;
  const gain =
    typeof volume === "function" ? volume(Math.max(0, clipLocal)) : volume;

  if (!enableHtml) {
    return null;
  }

  return (
    <PreviewAudio
      src={src}
      mediaSeconds={Math.max(0, clipLocal) / fps}
      playing={playback.playing && clipLocal >= 0}
      muted={playback.muted}
      loop={loop}
      volume={Math.max(0, Math.min(1, gain))}
    />
  );
}

/**
 * Hidden HTML audio for studio playback (not used during capture).
 */
function PreviewAudio({
  src,
  mediaSeconds,
  playing,
  muted,
  loop,
  volume,
}: {
  src: string;
  mediaSeconds: number;
  playing: boolean;
  muted: boolean;
  loop: boolean;
  volume: number;
}) {
  const nodeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    node.loop = loop;
    node.muted = muted;
    node.volume = volume;
  }, [loop, muted, volume]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    let cancelled = false;

    const sync = async () => {
      try {
        if (node.readyState < 1) {
          await new Promise<void>((resolve, reject) => {
            const onLoaded = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              reject(new Error(`Failed to load audio: ${src}`));
            };
            const cleanup = () => {
              node.removeEventListener("loadedmetadata", onLoaded);
              node.removeEventListener("error", onError);
            };
            node.addEventListener("loadedmetadata", onLoaded);
            node.addEventListener("error", onError);
          });
        }
        if (cancelled) return;

        const duration = Number.isFinite(node.duration) ? node.duration : 0;
        let target = mediaSeconds;
        if (loop && duration > 0) {
          target = mediaSeconds % duration;
        }

        if (!playing) {
          node.pause();
          if (Math.abs(node.currentTime - target) > 0.05) {
            node.currentTime = target;
          }
          return;
        }

        const drift = Math.abs(node.currentTime - target);
        if (drift > DRIFT_SECONDS) {
          node.currentTime = target;
        }
        if (node.paused) {
          await node.play().catch(() => {
            // Autoplay may be blocked until the user hits Play
          });
        }
      } catch {
        // Preview audio is best-effort
      }
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [mediaSeconds, playing, src]);

  return (
    <audio
      ref={nodeRef}
      src={src}
      preload="auto"
      playsInline
      style={{ display: "none" }}
    />
  );
}
