import { useEffect, useMemo, useState } from "react";
import type { SceneAudioClip } from "../src/scene-audio-parse";
import {
  loadFilePeaks,
  mixPeakBars,
  peaksForTimelineClip,
  type FilePeaks,
} from "./audioPeaks";

export const WAVEFORM_BAR_STEP_PX = 4;
const MIN_BARS = 8;
const MAX_BARS = 480;

/**
 * Bar count that stays readable as the timeline zooms.
 */
export function waveformBarCount({ width }: { width: number }): number {
  return Math.min(
    MAX_BARS,
    Math.max(MIN_BARS, Math.floor(width / WAVEFORM_BAR_STEP_PX)),
  );
}

/**
 * Decode and mix scene audio into a bar envelope for the clip width.
 */
export function useClipWaveformValues({
  clips,
  width,
  durationInFrames,
  fps,
}: {
  clips: SceneAudioClip[];
  width: number;
  durationInFrames: number;
  fps: number;
}): number[] | null {
  const barCount = waveformBarCount({ width });
  const [files, setFiles] = useState<Array<FilePeaks | null>>([]);
  const srcKey = clips.map((clip) => clip.src).join("|");

  useEffect(() => {
    if (clips.length === 0) {
      setFiles([]);
      return;
    }
    let cancelled = false;
    void Promise.all(clips.map((clip) => loadFilePeaks({ src: clip.src }))).then(
      (next) => {
        if (!cancelled) setFiles(next);
      },
    );
    return () => {
      cancelled = true;
    };
    // srcKey avoids refetching when the parent passes a new clips array
  }, [srcKey]);

  const durationSeconds = durationInFrames / Math.max(0.001, fps);

  return useMemo(() => {
    if (clips.length === 0 || width < 12 || durationSeconds <= 0) return null;
    const groups: number[][] = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const file = files[i];
      if (!clip || !file) continue;
      groups.push(
        peaksForTimelineClip({
          file,
          barCount,
          clipDurationSeconds: durationSeconds,
          loop: clip.loop,
          startFromSeconds: (clip.startFromFrame ?? 0) / Math.max(0.001, fps),
          mediaStartSeconds: clip.mediaStartSeconds,
          mediaEndSeconds: clip.mediaEndSeconds,
        }),
      );
    }
    if (groups.length === 0) return null;
    const mixed = mixPeakBars({ groups });
    const loudest = mixed.reduce((max, value) => Math.max(max, value), 0);
    return loudest < 0.04 ? null : mixed;
  }, [barCount, clips, durationSeconds, files, fps, width]);
}
