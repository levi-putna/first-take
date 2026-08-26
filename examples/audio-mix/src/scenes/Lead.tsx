import {
  AbsoluteFill,
  interpolate,
  useSequenceDuration,
  useVideoConfig,
} from "@levi-putna/storyboard-core";
import { Audio, staticFile } from "@levi-putna/storyboard-media";

/**
 * Lead-in bumper with an optional jingle that fades out as the VO starts.
 */
export default function Lead({
  jingle,
  jingleVolume = 0.55,
  jingleFadeOutSeconds = 0.3,
}: {
  jingle?: string;
  jingleVolume?: number;
  jingleFadeOutSeconds?: number;
}) {
  const { fps } = useVideoConfig();
  const sequenceDuration = useSequenceDuration() ?? 30;
  const fadeFrames = Math.max(1, Math.round(jingleFadeOutSeconds * fps));

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a3d3d" }}>
      {jingle ? (
        <Audio
          src={staticFile(jingle)}
          volume={(localFrame) =>
            interpolate(
              localFrame,
              [sequenceDuration - fadeFrames, sequenceDuration],
              [jingleVolume, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
}
