import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/hello-explainer/src/components/LeadIn.tsx";
import Comp1 from "/Users/leviputna/workspace/storyboard/examples/hello-explainer/src/scenes/01-Hook.tsx";
import Comp2 from "/Users/leviputna/workspace/storyboard/examples/hello-explainer/src/scenes/02-Fix.tsx";
import Comp3 from "/Users/leviputna/workspace/storyboard/examples/hello-explainer/src/scenes/Mix.tsx";

export const manifest = {
  "schemaVersion": 3,
  "slug": "hello-explainer",
  "title": "Hello Explainer",
  "fps": 30,
  "formats": [
    {
      "id": "16x9",
      "aspectRatio": "16:9",
      "width": 1920,
      "height": 1080
    },
    {
      "id": "9x16",
      "aspectRatio": "9:16",
      "width": 1080,
      "height": 1920
    },
    {
      "id": "1x1",
      "aspectRatio": "1:1",
      "width": 1080,
      "height": 1080
    }
  ],
  "assetsRoot": ".",
  "tracks": [
    {
      "id": "visual",
      "title": "Visual",
      "scenes": [
        {
          "id": "lead",
          "title": "Lead-in",
          "visualType": "component",
          "component": "src/components/LeadIn.tsx",
          "props": {
            "label": "Storyboard",
            "jingle": "assets/audio/intro-jingle.mp3",
            "jingleVolume": 0.55,
            "jingleFadeOutSeconds": 0.6
          },
          "durationInFrames": 120,
          "gapBeforeFrames": 0
        },
        {
          "id": "01",
          "title": "Hook",
          "visualType": "component",
          "component": "src/scenes/01-Hook.tsx",
          "props": {
            "headline": "You hit Tab. Nothing highlights."
          },
          "durationInFrames": 90,
          "gapBeforeFrames": 0
        }
      ]
    },
    {
      "id": "visual-b",
      "title": "Visual B",
      "scenes": [
        {
          "id": "02",
          "title": "Fix",
          "visualType": "component",
          "component": "src/scenes/02-Fix.tsx",
          "props": {
            "headline": "Focus rings make the path obvious."
          },
          "durationInFrames": 120,
          "gapBeforeFrames": 195
        }
      ]
    },
    {
      "id": "audio",
      "title": "Audio",
      "scenes": [
        {
          "id": "mix",
          "title": "Mix",
          "visualType": "component",
          "component": "src/scenes/Mix.tsx",
          "props": {
            "bed": "assets/audio/bed-loop.mp3",
            "narration": "assets/audio/narration.mp3",
            "voStartFrame": 120,
            "bedVolumeUnderVo": 0.12,
            "bedVolumeLeadIn": 0.08,
            "bedFadeInSeconds": 0.8,
            "bedFadeOutSeconds": 1.2
          },
          "durationInFrames": 315,
          "gapBeforeFrames": 0
        }
      ]
    }
  ]
} as VideoManifest;
export const components = {
  "src/components/LeadIn.tsx": Comp0,
  "src/scenes/01-Hook.tsx": Comp1,
  "src/scenes/02-Fix.tsx": Comp2,
  "src/scenes/Mix.tsx": Comp3
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/hello-explainer/video.json";
