# Clip Trim Fullscreen

A long source clip trimmed inside `<Video>` (`startFrom` / `endAt`) while the scene duration is shorter than the file. The rest of the source is never shown.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 600-frame trimmed fullscreen clip |

## Commands

```bash
pnpm first-take validate examples/clip-trim-fullscreen/video.json
pnpm first-take preview examples/clip-trim-fullscreen/video.json
pnpm first-take render examples/clip-trim-fullscreen/video.json --format=16x9 --silent
```
