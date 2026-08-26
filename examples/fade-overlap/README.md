# Fade Overlap

Two solid colour scenes with a 10-frame crossfade. Sequential `transitionIn` shortens the track: 30 + 30 − 10 = 50 frames.

## Tracks

| Track | Scenes |
|-------|--------|
| Main | Red (30f) then Blue (30f, fade 10f) |

## Commands

```bash
yarn storyboard validate examples/fade-overlap/video.json
yarn storyboard preview examples/fade-overlap/video.json
yarn storyboard render examples/fade-overlap/video.json --format=16x9 --silent
```
