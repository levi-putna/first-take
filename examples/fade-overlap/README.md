# Fade Overlap

Two solid colour scenes with a 10-frame crossfade on **overlapping tracks**. Red holds on the main lane; blue sits on a higher track with `gapBeforeFrames: 20` and fades in over 10 frames. Total duration stays **50 frames**.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | Red (30f) |
| Overlay | Blue (30f, gap 20f, in-scene fade 10f) |

## Commands

```bash
pnpm first-take validate examples/fade-overlap/video.json
pnpm first-take preview examples/fade-overlap/video.json
pnpm first-take render examples/fade-overlap/video.json --format=16x9 --silent
```
