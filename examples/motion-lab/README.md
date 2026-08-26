# Motion Lab

Example composition for checking common frame-driven animations and timeline consistency.

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

Every scene includes a bottom **frame timeline** (absolute frame index, seconds, progress bar) so you can verify timing across fades.

## Commands

```bash
yarn install
yarn storyboard validate examples/motion-lab/video.json
yarn storyboard preview examples/motion-lab/video.json
yarn storyboard render examples/motion-lab/video.json
```
