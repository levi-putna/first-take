import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/track-overlay/src/scenes/Background.tsx";
import Comp1 from "/Users/leviputna/workspace/storyboard/examples/track-overlay/src/scenes/OverlayA.tsx";
import Comp2 from "/Users/leviputna/workspace/storyboard/examples/track-overlay/src/scenes/OverlayB.tsx";
import Comp3 from "/Users/leviputna/workspace/storyboard/examples/track-overlay/src/scenes/Badge.tsx";

export const manifest = {
  "schemaVersion": 3,
  "slug": "track-overlay",
  "title": "Track Overlay",
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
      "id": "background",
      "title": "Background",
      "scenes": [
        {
          "id": "bg",
          "title": "Background",
          "visualType": "component",
          "component": "src/scenes/Background.tsx",
          "props": {
            "label": "Full-length background"
          },
          "durationInFrames": 240,
          "gapBeforeFrames": 0
        }
      ]
    },
    {
      "id": "overlay",
      "title": "Overlay",
      "scenes": [
        {
          "id": "title-a",
          "title": "Lower third A",
          "visualType": "component",
          "component": "src/scenes/OverlayA.tsx",
          "props": {
            "headline": "First callout",
            "detail": "Fades in over empty track after a gap."
          },
          "durationInFrames": 60,
          "gapBeforeFrames": 20
        },
        {
          "id": "title-b",
          "title": "Lower third B",
          "visualType": "component",
          "component": "src/scenes/OverlayB.tsx",
          "props": {
            "headline": "Second callout",
            "detail": "Another gap, then this overlay."
          },
          "durationInFrames": 80,
          "gapBeforeFrames": 40
        }
      ]
    },
    {
      "id": "badge",
      "title": "Badge",
      "scenes": [
        {
          "id": "badge",
          "title": "Corner badge",
          "visualType": "component",
          "component": "src/scenes/Badge.tsx",
          "props": {
            "label": "LIVE"
          },
          "durationInFrames": 120,
          "gapBeforeFrames": 50
        }
      ]
    }
  ]
} as VideoManifest;
export const components = {
  "src/scenes/Background.tsx": Comp0,
  "src/scenes/OverlayA.tsx": Comp1,
  "src/scenes/OverlayB.tsx": Comp2,
  "src/scenes/Badge.tsx": Comp3
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/track-overlay/video.json";
