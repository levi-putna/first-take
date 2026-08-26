import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/audio-volume-fade/src/scenes/VolumeFade.tsx";

export const manifest = {
  "schemaVersion": 2,
  "slug": "audio-volume-fade",
  "title": "Audio Volume Fade",
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
          "title": "Bed fade out then in",
          "visualType": "component",
          "component": "src/scenes/VolumeFade.tsx",
          "props": {
            "bed": "assets/audio/bed-loop.mp3"
          },
          "durationInFrames": 180,
          "gapBeforeFrames": 0,
          "transitionIn": null
        }
      ]
    }
  ]
} as VideoManifest;
export const components = {
  "src/scenes/VolumeFade.tsx": Comp0
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/audio-volume-fade/video.json";
