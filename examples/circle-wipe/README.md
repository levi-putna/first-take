# Circle Wipe

Two colour holds on the main track with a **circle iris wipe** on a higher track. Black closes to a centre point over 1.5 seconds, holds one frame fully black, then opens fully back out over 1.5 seconds. The wipe clip’s first and last frames are identical — the overlay is fully transparent — so the hold underneath shows through unchanged at both edges. No framework transition fields; the wipe is entirely in-scene.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Layout |
|-------|--------|
| Main | Teal circle (180f / 6s), then amber square (180f / 6s) |
| Wipe | Iris mask (90f / 3s) starting 135f — overlaps the last 1.5s of scene A and first 1.5s of scene B |

Composition length is **360 frames** (12 seconds at 30 fps).

## Commands

```bash
yarn storyboard validate examples/circle-wipe/video.json
yarn storyboard preview examples/circle-wipe/video.json
yarn storyboard render examples/circle-wipe/video.json --format=16x9 --silent
```
