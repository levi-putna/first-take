# Clip Zoom Presenter

Ken Burns-style zoom on a presenter clip: ease in, hold, ease out. Scale is a function of `useCurrentFrame()`.

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 240-frame zoom scene |

## Commands

```bash
yarn storyboard validate examples/clip-zoom-presenter/video.json
yarn storyboard preview examples/clip-zoom-presenter/video.json
yarn storyboard render examples/clip-zoom-presenter/video.json --format=16x9 --silent
```
