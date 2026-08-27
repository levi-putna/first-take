import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/clip-sound-move/src/scenes/SoundMove.tsx";

export const manifest = {
  "schemaVersion": 2,
  "slug": "clip-sound-move",
  "title": "Clip Sound Move",
  "fps": 30,
  "formats": [
    {
      "id": "16x9",
      "aspectRatio": "16:9",
      "width": 1280,
      "height": 720
    }
  ],
  "assetsRoot": ".",
  "tracks": [
    {
      "id": "main",
      "title": "Main",
      "scenes": [
        {
          "id": "01",
          "title": "Moving clip with sound",
          "visualType": "component",
          "component": "src/scenes/SoundMove.tsx",
          "props": {},
          "durationInFrames": 240,
          "gapBeforeFrames": 0,
          "transitionIn": null
        }
      ]
    }
  ]
} as VideoManifest;
export const components = {
  "src/scenes/SoundMove.tsx": Comp0
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/clip-sound-move/video.json";
