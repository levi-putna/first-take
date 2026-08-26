# Track Overlay

Stacked tracks with gaps. A long opaque background sits on the bottom. Overlay scenes skip time with `gapBeforeFrames` (empty track, not a spacer clip). A third track shows z-order with a corner badge that overlaps both callouts.

A fade after a gap is a fade-in from empty: it does **not** shorten the track.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Layout |
|-------|--------|
| Background | One opaque scene for 240f |
| Overlay | Lower-third A at 20f (60f), gap 40f, then lower-third B (80f) |
| Badge | Corner badge from 50f for 120f |

Composition length is 240 frames (the background).

## Commands

```bash
yarn storyboard validate examples/track-overlay/video.json
yarn storyboard preview examples/track-overlay/video.json
yarn storyboard render examples/track-overlay/video.json --format=16x9 --silent
```
