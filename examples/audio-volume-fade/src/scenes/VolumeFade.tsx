import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@storyboard/core";
import { Audio, staticFile } from "@storyboard/media";

const PEAK = 0.75;
/** Hold peak, then fade to silence. */
const FADE_OUT_START = 45;
const FADE_OUT_END = 90;
/** Rise from silence back to peak. */
const FADE_IN_START = 90;
const FADE_IN_END = 135;

/**
 * Bed volume for a local composition frame: hold → fade out → fade in → hold.
 */
export function bedVolumeAtFrame(frame: number): number {
  if (frame < FADE_OUT_START) return PEAK;
  if (frame < FADE_OUT_END) {
    return interpolate(frame, [FADE_OUT_START, FADE_OUT_END], [PEAK, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  if (frame < FADE_IN_END) {
    return interpolate(frame, [FADE_IN_START, FADE_IN_END], [0, PEAK], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return PEAK;
}

/**
 * Looped bed with a mid-timeline volume dip (fade out then back in).
 * Visual meter mirrors the same envelope for manual QA.
 */
export default function VolumeFade() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const volume = bedVolumeAtFrame(frame);

  const meterWidth = Math.round(width * 0.55);
  const meterHeight = Math.max(18, Math.round(height * 0.04));
  const fillWidth = Math.round(meterWidth * (volume / PEAK));

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 30% 20%, #1c3344 0%, #0a1218 55%, #06090c 100%)",
      }}
    >
      {/* Timeline audio: looped bed with V-shaped volume envelope */}
      <Audio
        src={staticFile("assets/audio/bed-loop.mp3")}
        startFromFrame={0}
        loop
        volume={(localFrame) => bedVolumeAtFrame(localFrame)}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.18,
          color: "rgba(236, 244, 250, 0.95)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(28, width * 0.032),
          letterSpacing: "0.02em",
        }}
      >
        Audio volume fade
      </div>

      {/* Supporting line */}
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.28,
          color: "rgba(190, 210, 225, 0.75)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(16, width * 0.018),
          maxWidth: width * 0.7,
        }}
      >
        Bed loops at peak, fades to silence, then fades back in.
      </div>

      {/* Volume meter label */}
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.52,
          color: "rgba(190, 210, 225, 0.65)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: Math.max(13, width * 0.014),
        }}
      >
        volume {volume.toFixed(2)}
      </div>

      {/* Volume meter track */}
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.58,
          width: meterWidth,
          height: meterHeight,
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Volume meter fill */}
        <div
          style={{
            width: fillWidth,
            height: "100%",
            background: "linear-gradient(90deg, #3d8ea8 0%, #7ec8dc 100%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
