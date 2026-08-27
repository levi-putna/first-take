import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/clip-overlay-shapes/src/scenes/OverlayShapes.tsx";

export const manifest = {
  "schemaVersion": 2,
  "slug": "clip-overlay-shapes",
  "title": "Clip Overlay Shapes",
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
          "title": "Shapes over video",
          "visualType": "component",
          "component": "src/scenes/OverlayShapes.tsx",
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
  "src/scenes/OverlayShapes.tsx": Comp0
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/clip-overlay-shapes/video.json";
