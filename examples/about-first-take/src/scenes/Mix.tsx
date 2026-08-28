import {
  AbsoluteFill,
  interpolate,
  useVideoConfig,
} from "first-take";
import { Audio, staticFile } from "first-take/media";

/**
 * Transparent full-length mix: looping bed plus delayed narration.
 * Wired at Gate 5 once narration.mp3 exists.
 */
export default function Mix({
  bed,
  narration,
  voStartFrame = 120,
  bedVolumeUnderVo = 0.12,
  bedVolumeLeadIn = 0.08,
  bedFadeInSeconds = 0.8,
  bedFadeOutSeconds = 1.2,
}: {
  bed?: string;
  narration?: string;
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
      {bed ? (
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
      ) : null}
      {narration ? (
        <Audio src={staticFile(narration)} startFromFrame={voStartFrame} />
      ) : null}
    </AbsoluteFill>
  );
}
