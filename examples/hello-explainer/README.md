# Hello Explainer

A short narrated explainer on two tracks. The old lead-in bumper is now the first visual scene. Mix (jingle on the bumper, looping bed + VO on a spanning audio scene) lives in components and props, not a root `seriesAudio` block.

Catalogue: [examples/README.md](../README.md).

## Preview

16:9

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

9:16

<video src="./preview-9x16.mp4" controls playsinline width="360"></video>

[Play 9:16 preview](./preview-9x16.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Visual | Lead-in (120f, jingle), Hook (90f), Fix (120f with a 15f fade) |
| Audio | Mix (315f): bed + narration from frame 120 |

Composition length is 315 frames (no tail). Double-click a clip in preview to isolate that scene.

## Commands

```bash
pnpm first-take validate examples/hello-explainer/video.json
pnpm first-take preview examples/hello-explainer/video.json
pnpm first-take render examples/hello-explainer/video.json --format=16x9
```
