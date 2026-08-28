# Clip Zoom Presenter

Ken Burns-style zoom on a presenter clip: ease in, hold, ease out. Scale is a function of `useCurrentFrame()`.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 240-frame zoom scene |

## Commands

```bash
pnpm first-take validate examples/clip-zoom-presenter/video.json
pnpm first-take preview examples/clip-zoom-presenter/video.json
pnpm first-take render examples/clip-zoom-presenter/video.json --format=16x9 --silent
```
