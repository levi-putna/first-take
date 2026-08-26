import type { VideoManifest } from "@levi-putna/storyboard-schema";
import Comp0 from "/Users/leviputna/workspace/storyboard/examples/audio-mix/src/scenes/Content.tsx";
import Comp1 from "/Users/leviputna/workspace/storyboard/examples/audio-mix/src/scenes/Lead.tsx";

export const manifest = {
  "schemaVersion": 1,
  "slug": "audio-mix",
  "title": "Audio Mix",
  "fps": 30,
  "formats": [
    {
      "id": "16x9",
      "aspectRatio": "16:9",
      "width": 640,
      "height": 360
    }
  ],
  "assetsRoot": ".",
  "leadIn": {
    "component": "src/scenes/Lead.tsx",
    "props": {}
  },
  "seriesAudio": {
    "leadInSeconds": 1,
    "jingle": "assets/audio/intro-jingle.mp3",
    "bed": "assets/audio/bed-loop.mp3",
    "narration": "assets/audio/narration.mp3",
    "jingleVolume": 0.55,
    "bedVolumeUnderVo": 0.12,
    "bedVolumeLeadIn": 0.08,
    "jingleFadeOutSeconds": 0.3,
    "bedFadeInSeconds": 0.2,
    "bedFadeOutSeconds": 0.3,
    "tailSeconds": 0.5
  },
  "scenes": [
    {
      "id": "01",
      "title": "Content",
      "visualType": "component",
      "component": "src/scenes/Content.tsx",
      "props": {},
      "durationInFrames": 60,
      "transitionIn": null
    }
  ]
} as VideoManifest;
export const components = {
  "src/scenes/Content.tsx": Comp0,
  "src/scenes/Lead.tsx": Comp1
};
export const manifestPath = "/Users/leviputna/workspace/storyboard/examples/audio-mix/video.json";
export const playgroundModules = import.meta.glob("/Users/leviputna/workspace/storyboard/examples/audio-mix/src/**/*.{tsx,ts}", { eager: true });
