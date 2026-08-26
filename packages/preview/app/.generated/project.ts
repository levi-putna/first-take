import type { VideoManifest } from "@storyboard/schema";
import Comp0 from "/Users/leviputna/Movies/First Take/2026-08-05 at 16.11.55/storyboard/scenes/ScreenComposite.tsx";

export const manifest = {
  "schemaVersion": 1,
  "slug": "first-take-edit",
  "title": "2026-08-05 at 16.11.55",
  "fps": 30,
  "formats": [
    {
      "id": "export",
      "aspectRatio": "16:9",
      "width": 1920,
      "height": 1080
    }
  ],
  "assetsRoot": "..",
  "scenes": [
    {
      "id": "composite",
      "title": "Screen composite",
      "visualType": "component",
      "component": "scenes/ScreenComposite.tsx",
      "props": {
        "animations": {
          "cursorStyle": "smooth",
          "motionBlur": 0.4,
          "screenStyle": "focused"
        },
        "audio": {
          "improveMicrophone": true,
          "micMuted": false,
          "systemMuted": false
        },
        "camera": {
          "mirror": false,
          "position": "bottomTrailing",
          "presentation": "pictureInPicture",
          "roundness": 0.35,
          "shape": "original",
          "size": 0.28,
          "visible": true
        },
        "captions": {
          "cues": [],
          "language": "auto",
          "prompt": "",
          "whisperModel": "small"
        },
        "cursor": {
          "clickEffect": "ripple",
          "clickEffectEnabled": true,
          "clickSound": "click",
          "clickSoundEnabled": false,
          "hideWhenStatic": true,
          "hideWhenStaticIdleSeconds": 2,
          "loopToStart": false,
          "size": 1,
          "style": "pointer",
          "useCustomCursor": false,
          "visible": true
        },
        "leadInDuration": 0,
        "overlays": [
          {
            "component": "BouncingBall",
            "durationSeconds": 8.2,
            "id": "ov_85DEC6",
            "mode": "overlay",
            "name": "Bouncing Ball Animation",
            "props": {},
            "sourceFile": "overlays/BouncingBall.tsx",
            "startSeconds": 0
          }
        ],
        "screenVisible": true,
        "shortcuts": {
          "labelSize": 1,
          "show": true,
          "showSingleKeys": false,
          "timelineVisible": true
        },
        "slices": [
          {
            "cursor": {
              "disableSmoothing": false,
              "hide": false
            },
            "id": "slice_1",
            "micGain": 1,
            "sourceIn": 0,
            "sourceOut": 8.201666666666666,
            "speed": 1,
            "systemGain": 1
          }
        ],
        "sources": {
          "camera": "camera.mov",
          "hasKeyboardInput": true,
          "hasMouseInput": true,
          "inputEvents": "input.jsonl",
          "inputMeta": "input.meta.json",
          "microphone": "audio.m4a",
          "screen": "screen.mov"
        },
        "timelineScenes": [
          {
            "end": 8.201666666666666,
            "id": "scene_1",
            "name": "Scene 1",
            "overlays": [
              {
                "component": "BouncingBall",
                "durationSeconds": 8.2,
                "id": "ov_85DEC6",
                "mode": "overlay",
                "name": "Bouncing Ball Animation",
                "props": {},
                "sourceFile": "overlays/BouncingBall.tsx",
                "startOffset": 0
              }
            ],
            "start": 0
          }
        ],
        "tracks": {
          "layouts": [],
          "masks": [],
          "shortcuts": [],
          "zoom": []
        }
      },
      "durationInFrames": 246,
      "transitionIn": null
    }
  ]
} as VideoManifest;
export const components = {
  "scenes/ScreenComposite.tsx": Comp0
};
export const manifestPath = "/Users/leviputna/Movies/First Take/2026-08-05 at 16.11.55/storyboard/video.json";
export const playgroundModules = import.meta.glob("/Users/leviputna/Movies/First Take/2026-08-05 at 16.11.55/storyboard/src/**/*.{tsx,ts}", { eager: true });
