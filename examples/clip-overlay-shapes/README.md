# Clip Overlay Shapes

A fullscreen clip with frame-driven shapes drawn on top. The footage stays in one scene; overlays are React, not extra tracks.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 240-frame overlay scene |

## Commands

```bash
pnpm first-take validate examples/clip-overlay-shapes/video.json
pnpm first-take preview examples/clip-overlay-shapes/video.json
pnpm first-take render examples/clip-overlay-shapes/video.json --format=16x9 --silent
```
