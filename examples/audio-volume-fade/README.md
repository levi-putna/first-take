# Audio Volume Fade

In-scene `<Audio>` with a volume envelope. The bed path is a prop; the component fades the loop out, then back in, and draws a meter so you can see the same curve.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

Unmute the player to hear the V-shaped fade.

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 180-frame scene with a looped bed |

## Commands

```bash
yarn storyboard validate examples/audio-volume-fade/video.json
yarn storyboard preview examples/audio-volume-fade/video.json
yarn storyboard render examples/audio-volume-fade/video.json --format=16x9
```
