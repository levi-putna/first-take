import fs from "node:fs";
import {
  listScenes,
  resolveComponentPath,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";
import {
  clipsFromComponentSource,
  clipsFromSceneProps,
  mergeSceneAudioClips,
  type SceneAudioClip,
} from "./scene-audio-parse.js";

export type { SceneAudioClip } from "./scene-audio-parse.js";
export {
  clipsFromComponentSource,
  clipsFromSceneProps,
  collectAudioPathsFromValue,
  mergeSceneAudioClips,
  normaliseAssetSrc,
} from "./scene-audio-parse.js";

/**
 * Per-scene audio sources from props plus the scene component source.
 */
export function listSceneAudioSources({
  manifest,
  manifestPath,
}: {
  manifest: VideoManifest;
  manifestPath: string;
}): Record<string, SceneAudioClip[]> {
  const scenes: Record<string, SceneAudioClip[]> = {};
  for (const scene of listScenes(manifest)) {
    const clips: SceneAudioClip[] = [
      ...clipsFromSceneProps({ props: scene.props }),
    ];
    const componentPath = resolveComponentPath({
      manifestPath,
      componentPath: scene.component,
    });
    if (fs.existsSync(componentPath)) {
      const source = fs.readFileSync(componentPath, "utf8");
      clips.push(
        ...clipsFromComponentSource({
          source,
          props: scene.props,
        }),
      );
    }
    scenes[scene.id] = mergeSceneAudioClips({ clips });
  }
  return scenes;
}
