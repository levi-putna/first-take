# Multi Format

One timeline, two formats. Layout should read `useVideoConfig().width` / `.height` so 16:9 and 9:16 share duration and scene order.

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
| Main | One 30-frame green hold |

## Commands

```bash
yarn storyboard validate examples/multi-format/video.json
yarn storyboard preview examples/multi-format/video.json
yarn storyboard render examples/multi-format/video.json --format=16x9 --silent
yarn storyboard render examples/multi-format/video.json --format=9x16 --silent
```
