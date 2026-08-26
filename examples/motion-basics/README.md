# Motion Basics

A single scene of frame-driven motion (`interpolate` from `useCurrentFrame()`). Use it as the smallest motion fixture.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 45-frame motion scene |

## Commands

```bash
yarn storyboard validate examples/motion-basics/video.json
yarn storyboard preview examples/motion-basics/video.json
yarn storyboard render examples/motion-basics/video.json --format=16x9 --silent
```
