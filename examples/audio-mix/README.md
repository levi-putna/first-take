# Audio Mix

Shows a visual track plus a full-length audio track. The jingle lives on the lead scene; looping bed and narration live on a transparent mix scene via props.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

Unmute the player to hear the jingle, bed, and narration.

## Tracks

| Track | Scenes |
|-------|--------|
| Visual | Lead (30f, jingle) then Content (60f) |
| Audio | Mix (90f): looped bed + VO from frame 30 |

There is no series mix and no tail hold. Composition length is the longest track (90 frames).

## Commands

```bash
yarn storyboard validate examples/audio-mix/video.json
yarn storyboard preview examples/audio-mix/video.json
yarn storyboard render examples/audio-mix/video.json --format=16x9
```
