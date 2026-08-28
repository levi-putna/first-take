# Timing and audio

How First Take lines up picture with sound. Audio is **in-scene**: components
mount `<Audio>` (and unmuted `<Video>`) whose file paths usually come from
props. There is no root `seriesAudio` mix.

## 1. Clocks

| Clock | Zero point | Used for |
|-------|------------|----------|
| **Composition** | Frame 0 of the rendered video | Track placement, capture, FFmpeg mux start |
| **Sequence / scene** | Frame 0 of the enclosing `Sequence` | `useCurrentFrame()`, `Audio startFromFrame` |

`<Audio startFromFrame>` is **relative to the enclosing Sequence** (usually `0`
inside a scene). The mux graph records
`compositionStart + startFromFrame`. Default clip length is the remaining
Sequence duration, not the whole composition, so a looping bed in a 90-frame
scene lasts 90 frames.

A full-length bed is a scene whose `durationInFrames` equals the video (see
[`examples/audio-mix`](../examples/audio-mix/README.md) and `create --with-audio`). Tracks do not auto-stretch.

## 2. Units

```
seconds → frames:  round(seconds * fps)
frames → seconds:  frame / fps
```

Use a consistent `fps` (default **30**). Author motion in seconds, then convert.

## 3. Track duration

See [06-video-json-schema.md](./06-video-json-schema.md) §5. Composition length
is `max(track lengths)`. Overlapping blends use multiple tracks; same-lane overlap is forbidden.

## 4. Typical explainer mix (as scenes)

Map the old series mix onto components:

```
Track visual
  scene lead   [0, leadFrames)     <Audio jingle> fade out as VO starts
  scene hook   …
  scene fix    … on a higher track with in-scene fade

Track audio
  scene mix    [0, total)          <Audio loop bed> + <Audio narration startFromFrame={leadFrames}>
```

Keep narration as **one file**. Delay it with `startFromFrame` on the mix
scene; do not chop it into one file per visual beat. Visual `durationInFrames`
for speech still comes from alignment + a small lead-out when you have those
numbers:

```
LEAD_OUT_FRAMES ≈ 3–5
durationInFrames = round((audioEndSeconds - audioStartSeconds) * fps) + LEAD_OUT_FRAMES
```

Those seconds are authoring math only. They are not schema fields.

Worked files: [`examples/hello-explainer`](../examples/hello-explainer/README.md),
[`examples/audio-mix`](../examples/audio-mix/README.md),
[`examples/audio-volume-fade`](../examples/audio-volume-fade/README.md).

## 5. Volume envelopes

Pass `volume` as a number or `(localFrame) => number`. At encode time the
renderer compiles `volumePerFrame` into an FFmpeg volume filter. There is no
separate global track gain.

Mute clip-native audio under VO unless you have reviewed the mix
(`<Video muted />`).

## 6. Preview vs render

| Surface | Behaviour |
|---------|-----------|
| **Preview** | Hidden HTML `<audio>` (and HTML5 `<video>` when unmuted) follows the transport. Honour `loop`. Resync if drift exceeds ~0.45s. Not sample-accurate. Mute toggle in the dock. Isolate unmounts other tracks, so their audio unmounts too. |
| **Capture / render** | `StoryboardProvider` defaults `playing: false`, `muted: true`. HTML audio is not mounted. FFmpeg muxes registered clips. |

Play in the studio is the autoplay gesture. Scrubbing seeks; paused preview
stays silent aside from seeking the element.

## 7. Multi-format timing

All formats share fps, duration, tracks, and audio. Only `width` / `height`
change. Never fork timings per aspect ratio.

## 8. Author checklist

- [ ] Audio paths live in props; `<Audio>` / `<Video>` live in the scene component
- [ ] Bed length is an explicit `durationInFrames` on that scene
- [ ] Overlapping blends use multiple tracks; same-lane overlap is forbidden
- [ ] Clip audio muted under VO by default
- [ ] Same timeline for every format
- [ ] `validate` sees the audio files (or you pass `--no-assets`)
