# Clip PIP Presenter

Picture-in-picture: a small presenter clip in the corner over motion graphics. Trim and layout are owned by the component; the manifest only sets duration and props.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 240-frame presenter scene |

## Commands

```bash
pnpm first-take validate examples/clip-pip-presenter/video.json
pnpm first-take preview examples/clip-pip-presenter/video.json
pnpm first-take render examples/clip-pip-presenter/video.json --format=16x9 --silent
```
