# Motion Lab

Example composition for checking common frame-driven animations and timeline consistency. Eight scenes alternate between a **main** track and an **overlay** track; overlay clips crossfade in and out in-scene while overlapping the main lane.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Scenes

| # | Pattern | Track |
|---|---------|-------|
| 01 | Typewriter text | Main |
| 02 | Two boxes drifting gently | Overlay |
| 03 | Circle pulse (scale up/down) | Main |
| 04 | Slide + fade | Overlay |
| 05 | Staggered list reveal | Main |
| 06 | Spring bounce | Overlay |
| 07 | Progress bar fill | Main |
| 08 | Rotation + numeric counter | Overlay |

Every scene includes a bottom **frame timeline** (absolute frame index, seconds, progress bar) so you can verify timing across fades. Double-click a clip to isolate that scene.

## Commands

```bash
pnpm first-take validate examples/motion-lab/video.json
pnpm first-take preview examples/motion-lab/video.json
pnpm first-take render examples/motion-lab/video.json --format=16x9 --silent
```
