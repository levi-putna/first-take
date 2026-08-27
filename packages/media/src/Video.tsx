import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
} from "react";
import {
  continueRender,
  delayRender,
  useAbsoluteFrame,
  useCurrentFrame,
  usePlayback,
  useSceneId,
  useVideoConfig,
} from "@levi-putna/storyboard-core";
import {
  buildVolumePerFrame,
  getAudioRegistry,
  type AudioClipDescriptor,
} from "./Audio.js";

export type VideoClipDescriptor = {
  id: string;
  src: string;
  /** Seconds into the source file where playback begins. */
  startFromSeconds: number;
  /** Seconds into the source file where playback ends (exclusive). */
  endAtSeconds?: number;
  /** Composition frame where this clip becomes visible. */
  startFromFrame: number;
  playbackRate: number;
  muted: boolean;
  volume: number;
};

type VideoRegistry = {
  clips: Map<string, VideoClipDescriptor>;
};

type VideoFrameMapEntry = {
  basePath: string;
  frameCount: number;
};

type VideoFrameMaps = Record<string, VideoFrameMapEntry>;

/**
 * Stable key for a trimmed source clip at a given composition fps.
 */
export function videoClipCacheKey({
  src,
  startFromSeconds,
  endAtSeconds,
  fps,
  playbackRate,
}: {
  src: string;
  startFromSeconds: number;
  endAtSeconds?: number;
  fps: number;
  playbackRate: number;
}): string {
  const end = endAtSeconds ?? "end";
  return `${src}|${startFromSeconds}|${end}|${fps}|${playbackRate}`;
}

function getVideoRegistry(): VideoRegistry {
  if (typeof window === "undefined") {
    return { clips: new Map() };
  }
  const w = window as unknown as { __STORYBOARD_VIDEO__?: VideoRegistry };
  if (!w.__STORYBOARD_VIDEO__) {
    w.__STORYBOARD_VIDEO__ = { clips: new Map() };
  }
  return w.__STORYBOARD_VIDEO__;
}

/**
 * Collect registered video clips for offthread frame extraction / audio mux.
 */
export function collectVideoClips(): VideoClipDescriptor[] {
  return [...getVideoRegistry().clips.values()];
}

/**
 * Clear registered video clips (between mounts).
 */
export function clearVideoClips(): void {
  getVideoRegistry().clips.clear();
}

function getVideoFrameMaps(): VideoFrameMaps {
  if (typeof window === "undefined") return {};
  return (
    (window as unknown as { __STORYBOARD_VIDEO_FRAMES__?: VideoFrameMaps })
      .__STORYBOARD_VIDEO_FRAMES__ ?? {}
  );
}

/**
 * Duration of the trimmed clip in composition frames.
 */
export function videoClipDurationInFrames({
  startFromSeconds,
  endAtSeconds,
  fps,
  playbackRate = 1,
  fallbackSeconds = 5,
}: {
  startFromSeconds: number;
  endAtSeconds?: number;
  fps: number;
  playbackRate?: number;
  fallbackSeconds?: number;
}): number {
  const span =
    endAtSeconds !== undefined
      ? Math.max(0, endAtSeconds - startFromSeconds)
      : fallbackSeconds;
  return Math.max(1, Math.round((span / playbackRate) * fps));
}

/**
 * Media time (seconds into the source file) for a local composition frame.
 */
export function mediaTimeForFrame({
  localFrame,
  fps,
  startFromSeconds,
  endAtSeconds,
  playbackRate = 1,
}: {
  localFrame: number;
  fps: number;
  startFromSeconds: number;
  endAtSeconds?: number;
  playbackRate?: number;
}): number {
  const raw = startFromSeconds + (localFrame / fps) * playbackRate;
  if (endAtSeconds === undefined) return Math.max(0, raw);
  // Hold the last displayable instant inside the trim window
  return Math.min(raw, Math.max(startFromSeconds, endAtSeconds - 1 / fps));
}

/**
 * Frame-accurate video layer (Remotion OffthreadVideo-style).
 * During render, Playwright shows pre-extracted JPEGs; in preview, seeks an HTML video.
 */
export function Video({
  src,
  startFrom = 0,
  endAt,
  style,
  className,
  muted = false,
  volume = 1,
  playbackRate = 1,
  objectFit = "cover",
}: {
  src: string;
  /** Start offset in the source file (seconds). */
  startFrom?: number;
  /** End offset in the source file (seconds). */
  endAt?: number;
  style?: CSSProperties;
  className?: string;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  objectFit?: CSSProperties["objectFit"];
}) {
  const id = useId();
  const frame = useCurrentFrame();
  const absoluteFrame = useAbsoluteFrame();
  const playback = usePlayback();
  const sceneId = useSceneId();
  const { fps, durationInFrames: totalFrames } = useVideoConfig();

  const compositionStartFrame = absoluteFrame - frame;
  const cacheKey = videoClipCacheKey({
    src,
    startFromSeconds: startFrom,
    endAtSeconds: endAt,
    fps,
    playbackRate,
  });

  // Synchronous registration for capture collection
  getVideoRegistry().clips.set(id, {
    id,
    src,
    startFromSeconds: startFrom,
    endAtSeconds: endAt,
    startFromFrame: compositionStartFrame,
    playbackRate,
    muted,
    volume,
  });

  // Mux source audio (trimmed) unless muted
  if (!muted) {
    const clipDuration = videoClipDurationInFrames({
      startFromSeconds: startFrom,
      endAtSeconds: endAt,
      fps,
      playbackRate,
    });
    const audioClip: AudioClipDescriptor = {
      id: `video-audio:${id}`,
      src,
      startFromFrame: compositionStartFrame,
      durationInFrames: clipDuration,
      loop: false,
      sceneId: sceneId ?? undefined,
      volumePerFrame: buildVolumePerFrame({
        totalFrames,
        startFromFrame: compositionStartFrame,
        durationInFrames: clipDuration,
        volume,
      }),
      mediaStartSeconds: startFrom,
      mediaEndSeconds: endAt,
    };
    getAudioRegistry().clips.set(audioClip.id, audioClip);
  }

  useEffect(() => {
    return () => {
      getVideoRegistry().clips.delete(id);
      getAudioRegistry().clips.delete(`video-audio:${id}`);
    };
  }, [id]);

  const frameMaps = getVideoFrameMaps();
  const extracted = frameMaps[cacheKey];

  const mergedStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit,
    display: "block",
    ...style,
  };

  // Render path: show pre-extracted still for this composition frame
  if (extracted) {
    const index = Math.min(Math.max(0, frame), extracted.frameCount - 1);
    const frameSrc = `${extracted.basePath}/frame-${String(index).padStart(6, "0")}.jpg`;
    return (
      <OffthreadFrame
        src={frameSrc}
        style={mergedStyle}
        className={className}
      />
    );
  }

  // Preview / fallback: HTML5 video seeked to the exact media time
  return (
    <Html5VideoFrame
      src={src}
      mediaTime={mediaTimeForFrame({
        localFrame: frame,
        fps,
        startFromSeconds: startFrom,
        endAtSeconds: endAt,
        playbackRate,
      })}
      muted={muted || playback.muted}
      playing={playback.playing && !muted}
      style={mergedStyle}
      className={className}
    />
  );
}

/**
 * Image that blocks capture until the offthread frame is decoded.
 */
function OffthreadFrame({
  src,
  style,
  className,
}: {
  src: string;
  style?: CSSProperties;
  className?: string;
}) {
  const [handle] = useState(() => delayRender(`VideoFrame:${src}`));

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      try {
        if (img.decode) await img.decode();
      } catch {
        // decode may fail; still continue
      }
      if (!cancelled) continueRender(handle);
    };
    img.onerror = () => {
      if (!cancelled) continueRender(handle);
    };
    img.src = src;
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [src, handle]);

  return <img src={src} alt="" style={style} className={className} />;
}

/**
 * Preview helper — seeks an HTML video element to the timeline media time.
 */
function Html5VideoFrame({
  src,
  mediaTime,
  muted,
  playing,
  style,
  className,
}: {
  src: string;
  mediaTime: number;
  muted: boolean;
  playing: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const [handle] = useState(() => delayRender(`Html5Video:${src}`));
  const [node, setNode] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!node) return;
    let cancelled = false;

    const seek = async () => {
      try {
        if (node.readyState < 1) {
          await new Promise<void>((resolve, reject) => {
            const onLoaded = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              reject(new Error(`Failed to load video: ${src}`));
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
        const drift = Math.abs(node.currentTime - mediaTime);
        if (!playing) {
          node.pause();
          node.currentTime = mediaTime;
          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              node.removeEventListener("seeked", onSeeked);
              resolve();
            };
            node.addEventListener("seeked", onSeeked);
          });
        } else {
          if (drift > 0.45) {
            node.currentTime = mediaTime;
          }
          if (node.paused) {
            await node.play().catch(() => {
              // Autoplay may be blocked until the user hits Play
            });
          }
        }
      } catch {
        // continue even if seek fails so capture does not hang
      } finally {
        if (!cancelled) continueRender(handle);
      }
    };

    void seek();
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [node, mediaTime, src, handle, playing]);

  return (
    <video
      ref={setNode}
      src={src}
      muted={muted}
      playsInline
      preload="auto"
      style={style}
      className={className}
    />
  );
}
