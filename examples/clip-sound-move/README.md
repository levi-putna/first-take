# Clip Sound Move

A sound-on clip that drifts around the frame. Preview plays the clip audio while the transport is playing (unmute in the dock). Render muxes the clip soundtrack.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

Unmute the player to hear the clip soundtrack.

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 240-frame moving clip |

## Commands

```bash
pnpm first-take validate examples/clip-sound-move/video.json
pnpm first-take preview examples/clip-sound-move/video.json
pnpm first-take render examples/clip-sound-move/video.json --format=16x9
```
