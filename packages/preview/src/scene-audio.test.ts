import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateVideoFile } from "@levi-putna/storyboard-schema";
import {
  clipsFromComponentSource,
  clipsFromSceneProps,
  mergeSceneAudioClips,
  readBooleanAttr,
} from "./scene-audio-parse.js";
import { listSceneAudioSources } from "./scene-audio.js";

const examplesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../examples",
);

describe("clipsFromSceneProps", () => {
  it("collects audio paths and ignores video paths", () => {
    expect(
      clipsFromSceneProps({
        props: {
          bed: "assets/audio/bed-loop.mp3",
          clip: "assets/clips/with-sound.mp4",
          label: "Storyboard",
        },
      }),
    ).toEqual([{ src: "assets/audio/bed-loop.mp3", loop: false }]);
  });
});

describe("clipsFromComponentSource", () => {
  it("keeps unmuted video and skips muted video", () => {
    const source = `
      function Scene() {
        return (
          <>
            <Video src={staticFile("assets/clips/with-sound.mp4")} muted={false} startFrom={0} endAt={8} />
            <Video src={staticFile("assets/clips/broll.mp4")} muted startFrom={10} endAt={15} />
          </>
        );
      }
    `;
    expect(clipsFromComponentSource({ source })).toEqual([
      {
        src: "assets/clips/with-sound.mp4",
        loop: false,
        mediaStartSeconds: 0,
        mediaEndSeconds: 8,
      },
    ]);
  });

  it("resolves Audio staticFile props and loop", () => {
    const source = `
      function Mix({ bed, narration, voStartFrame }) {
        return (
          <>
            <Audio src={staticFile(bed)} loop />
            <Audio src={staticFile(narration)} startFromFrame={voStartFrame} />
          </>
        );
      }
    `;
    expect(
      clipsFromComponentSource({
        source,
        props: {
          bed: "assets/audio/bed-loop.mp3",
          narration: "assets/audio/narration.mp3",
          voStartFrame: 30,
        },
      }),
    ).toEqual([
      { src: "assets/audio/bed-loop.mp3", loop: true, startFromFrame: undefined },
      {
        src: "assets/audio/narration.mp3",
        loop: false,
        startFromFrame: 30,
      },
    ]);
  });

  it("treats a bare muted attribute as muted", () => {
    expect(readBooleanAttr({ jsx: " muted objectFit", name: "muted" })).toBe(
      true,
    );
    expect(
      readBooleanAttr({ jsx: " muted={false} objectFit", name: "muted" }),
    ).toBe(false);
  });
});

describe("mergeSceneAudioClips", () => {
  it("prefers loop and trim from either side", () => {
    expect(
      mergeSceneAudioClips({
        clips: [
          { src: "/assets/audio/bed-loop.mp3", loop: false },
          {
            src: "assets/audio/bed-loop.mp3",
            loop: true,
            startFromFrame: 0,
          },
        ],
      }),
    ).toEqual([
      {
        src: "assets/audio/bed-loop.mp3",
        loop: true,
        startFromFrame: 0,
        mediaStartSeconds: undefined,
        mediaEndSeconds: undefined,
      },
    ]);
  });
});

describe("listSceneAudioSources", () => {
  it("detects mix audio and skips silent visual scenes in audio-mix", () => {
    const manifestPath = path.join(examplesRoot, "audio-mix/video.json");
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const scenes = listSceneAudioSources({
      manifest: result.manifest,
      manifestPath,
    });
    expect(scenes.content).toEqual([]);
    expect(scenes.lead?.some((clip) => clip.src.endsWith("intro-jingle.mp3"))).toBe(
      true,
    );
    expect(scenes.mix?.map((clip) => clip.src).sort()).toEqual([
      "assets/audio/bed-loop.mp3",
      "assets/audio/narration.mp3",
    ]);
    expect(scenes.mix?.find((clip) => clip.src.endsWith("bed-loop.mp3"))?.loop).toBe(
      true,
    );
  });

  it("detects sound-on video and ignores muted trim clips", () => {
    const soundPath = path.join(examplesRoot, "clip-sound-move/video.json");
    const soundResult = validateVideoFile({
      manifestPath: soundPath,
      checkAssets: false,
    });
    expect(soundResult.ok).toBe(true);
    if (!soundResult.ok) return;
    const sound = listSceneAudioSources({
      manifest: soundResult.manifest,
      manifestPath: soundPath,
    });
    expect(sound["01"]?.[0]?.src).toBe("assets/clips/with-sound.mp4");

    const trimPath = path.join(examplesRoot, "clip-trim-fullscreen/video.json");
    const trimResult = validateVideoFile({
      manifestPath: trimPath,
      checkAssets: false,
    });
    expect(trimResult.ok).toBe(true);
    if (!trimResult.ok) return;
    const trim = listSceneAudioSources({
      manifest: trimResult.manifest,
      manifestPath: trimPath,
    });
    expect(Object.values(trim).flat()).toEqual([]);
  });
});
