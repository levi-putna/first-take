import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/circle-wipe/src/scenes/01-TealCircle.tsx";
import Comp1 from "/Users/leviputna/workspace/storyboard/examples/circle-wipe/src/scenes/02-AmberSquare.tsx";
import Comp2 from "/Users/leviputna/workspace/storyboard/examples/circle-wipe/src/scenes/Wipe.tsx";

export const manifest = {
  "schemaVersion": 3,
  "slug": "circle-wipe",
  "title": "Circle Wipe",
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
          "title": "Teal circle",
          "visualType": "component",
          "component": "src/scenes/01-TealCircle.tsx",
          "props": {},
          "durationInFrames": 180,
          "gapBeforeFrames": 0
        },
        {
          "id": "02",
          "title": "Amber square",
          "visualType": "component",
          "component": "src/scenes/02-AmberSquare.tsx",
          "props": {},
          "durationInFrames": 180,
          "gapBeforeFrames": 0
        }
      ]
    },
    {
      "id": "wipe",
      "title": "Wipe",
      "scenes": [
        {
          "id": "wipe",
          "title": "Circle wipe",
          "visualType": "component",
          "component": "src/scenes/Wipe.tsx",
          "props": {},
          "durationInFrames": 90,
          "gapBeforeFrames": 135
        }
      ]
    }
  ]
} as VideoManifest;
export const components = {
  "src/scenes/01-TealCircle.tsx": Comp0,
  "src/scenes/02-AmberSquare.tsx": Comp1,
  "src/scenes/Wipe.tsx": Comp2
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/circle-wipe/video.json";
