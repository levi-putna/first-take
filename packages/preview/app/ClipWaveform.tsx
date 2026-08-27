import type { SceneAudioClip } from "../src/scene-audio-parse";
import {
  WAVEFORM_BAR_STEP_PX,
  waveformBarCount,
  useClipWaveformValues,
} from "./useClipWaveformValues";

/**
 * Bottom-aligned waveform drawn behind a timeline clip.
 * Bars sit on the clip baseline and grow upward from real audio peaks.
 */
export function ClipWaveform({
  clips,
  width,
  durationInFrames,
  fps,
}: {
  clips: SceneAudioClip[];
  width: number;
  durationInFrames: number;
  fps: number;
}) {
  const values = useClipWaveformValues({
    clips,
    width,
    durationInFrames,
    fps,
  });
  if (!values || values.length === 0) return null;

  const barStep = WAVEFORM_BAR_STEP_PX;
  const barCount = waveformBarCount({ width });
  const viewHeight = 28;
  const bars = values.slice(0, barCount);

  return (
    <svg
      aria-hidden
      className="sb-clip-wave-svg"
      viewBox={`0 0 ${barCount * barStep} ${viewHeight}`}
      preserveAspectRatio="none"
    >
      {bars.map((value, index) => {
        const barHeight = Math.round(Math.max(1, value * viewHeight) * 100) / 100;
        return (
          <rect
            key={index}
            x={index * barStep}
            y={viewHeight - barHeight}
            width={2}
            height={barHeight + 1}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
