# Clip Hard Cut

Two sequential `<Video>` clips with no fade. The second scene starts when the first ends on the same track.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | B-roll (150f) then second clip (150f) |

## Commands

```bash
yarn storyboard validate examples/clip-hard-cut/video.json
yarn storyboard preview examples/clip-hard-cut/video.json
yarn storyboard render examples/clip-hard-cut/video.json --format=16x9 --silent
```
