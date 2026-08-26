import type { ComponentType } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
} from "@storyboard/core";
import {
  leadInFrames,
  totalDurationInFrames,
  type VideoManifest,
} from "@storyboard/schema";
import { Audio, staticFile } from "@storyboard/media";
import { TransitionSeries, type ComponentMap } from "./TransitionSeries.js";

/**
 * Build jingle / bed / narration Audio layers from seriesAudio config.
 */
export function SeriesAudioLayers({
  manifest,
}: {
  manifest: VideoManifest;
}) {
  const audio = manifest.seriesAudio;
  if (!audio) return null;

  const fps = manifest.fps;
  const lead = leadInFrames(manifest);
  const total = totalDurationInFrames(manifest);
  const jingleFadeFrames = Math.round(audio.jingleFadeOutSeconds * fps);
  const bedFadeInFrames = Math.round(audio.bedFadeInSeconds * fps);
  const bedFadeOutFrames = Math.round(audio.bedFadeOutSeconds * fps);

  return (
    <>
      {audio.jingle ? (
        <Audio
          src={staticFile(audio.jingle)}
          startFromFrame={0}
          durationInFrames={lead + jingleFadeFrames}
          volume={(localFrame) => {
            if (localFrame < lead) return audio.jingleVolume;
            return (
              interpolate(
                localFrame,
                [lead, lead + jingleFadeFrames],
                [audio.jingleVolume, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )
            );
          }}
        />
      ) : null}

      {audio.narration ? (
        <Audio src={staticFile(audio.narration)} startFromFrame={lead} />
      ) : null}

      {audio.bed ? (
        <Audio
          src={staticFile(audio.bed)}
          startFromFrame={0}
          loop
          volume={(localFrame) => {
            // composition-relative: Audio passes local = f - startFromFrame = f
            let vol =
              localFrame < lead ? audio.bedVolumeLeadIn : audio.bedVolumeUnderVo;
            if (bedFadeInFrames > 0 && localFrame < bedFadeInFrames) {
              vol *= interpolate(localFrame, [0, bedFadeInFrames], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
            }
            if (bedFadeOutFrames > 0 && localFrame > total - bedFadeOutFrames) {
              vol *= interpolate(
                localFrame,
                [total - bedFadeOutFrames, total],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
            }
            return vol;
          }}
        />
      ) : null}
    </>
  );
}

function DefaultLeadIn() {
  return <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }} />;
}

/**
 * Assemble a full video from a validated manifest and component map.
 */
export function CompositionFromManifest({
  manifest,
  components,
}: {
  manifest: VideoManifest;
  components: ComponentMap;
}) {
  const lead = leadInFrames(manifest);
  const LeadIn =
    manifest.leadIn?.component && components[manifest.leadIn.component]
      ? (components[manifest.leadIn.component] as ComponentType<
          Record<string, unknown>
        >)
      : DefaultLeadIn;
  const leadProps = (manifest.leadIn?.props ?? {}) as Record<string, unknown>;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Visual lead-in */}
      {lead > 0 ? (
        <Sequence durationInFrames={lead} name="lead-in">
          <LeadIn {...leadProps} />
        </Sequence>
      ) : null}

      {/* Content scenes */}
      <Sequence from={lead} name="content">
        <TransitionSeries scenes={manifest.scenes} components={components} />
      </Sequence>

      {/* Audio layers (register for mux) */}
      <SeriesAudioLayers manifest={manifest} />
    </AbsoluteFill>
  );
}
