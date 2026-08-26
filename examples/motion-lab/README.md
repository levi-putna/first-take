# Motion Lab

Example composition for checking common frame-driven animations and timeline consistency. All eight scenes sit on one visual track with sequential fades between them.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Scenes

| # | Pattern |
|---|---------|
| 01 | Typewriter text |
| 02 | Two boxes drifting gently |
| 03 | Circle pulse (scale up/down) |
| 04 | Slide + fade |
| 05 | Staggered list reveal |
| 06 | Spring bounce |
| 07 | Progress bar fill |
| 08 | Rotation + numeric counter |

Every scene includes a bottom **frame timeline** (absolute frame index, seconds, progress bar) so you can verify timing across fades. Double-click a clip to isolate that scene.

## Commands

```bash
yarn storyboard validate examples/motion-lab/video.json
yarn storyboard preview examples/motion-lab/video.json
yarn storyboard render examples/motion-lab/video.json --format=16x9 --silent
```
