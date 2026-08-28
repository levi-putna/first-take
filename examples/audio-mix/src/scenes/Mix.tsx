import {
  AbsoluteFill,
  interpolate,
  useVideoConfig,
} from "first-take";
import { Audio, staticFile } from "first-take/media";

/**
 * Transparent full-length mix: looping bed plus delayed narration.
 */
export default function Mix({
  bed,
  narration,
  voStartFrame = 0,
  bedVolumeUnderVo = 0.12,
  bedVolumeLeadIn = 0.08,
  bedFadeInSeconds = 0.2,
  bedFadeOutSeconds = 0.3,
}: {
  bed: string;
  narration: string;
  voStartFrame?: number;
  bedVolumeUnderVo?: number;
  bedVolumeLeadIn?: number;
  bedFadeInSeconds?: number;
  bedFadeOutSeconds?: number;
}) {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeInFrames = Math.max(1, Math.round(bedFadeInSeconds * fps));
  const fadeOutFrames = Math.max(1, Math.round(bedFadeOutSeconds * fps));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Looping bed, ducked under voice-over */}
      <Audio
        src={staticFile(bed)}
        loop
        volume={(localFrame) => {
          const peak =
            localFrame >= voStartFrame ? bedVolumeUnderVo : bedVolumeLeadIn;
          const fadeIn = interpolate(
            localFrame,
            [0, fadeInFrames],
            [0, peak],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const held = localFrame < fadeInFrames ? fadeIn : peak;
          return (
            held *
            interpolate(
              localFrame,
              [durationInFrames - fadeOutFrames, durationInFrames],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          );
        }}
      />
      {/* Continuous VO from the first content beat */}
      <Audio src={staticFile(narration)} startFromFrame={voStartFrame} />
    </AbsoluteFill>
  );
}
