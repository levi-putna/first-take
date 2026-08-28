# Authoring guide

Practical how-to for writing videos. Normative contracts:

- Scene / video file: [06-video-json-schema.md](./06-video-json-schema.md)
- Component requirements: [10-component-requirements.md](./10-component-requirements.md)

## Frame-driven motion

Every animated value must come from `useCurrentFrame()` (or a pure function of it). Remotion-style rules apply — see [01-core-concepts.md](./01-core-concepts.md) and the full checklist in [10-component-requirements.md](./10-component-requirements.md).

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "first-take";

export default function TitleCard({ headline }: { headline: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity }}>{headline}</div>
    </AbsoluteFill>
  );
}
```

## Do not

- CSS `transition` / `animation` / Tailwind `animate-*`
- `setTimeout` / `requestAnimationFrame` for motion that must survive render
- Wall-clock spring libraries

## Project layout

```
my-video/
  video.json
  src/
    scenes/
    components/
  assets/
    audio/
```

Scaffold that layout with:

```bash
pnpm first-take create my-video
```

## CLI

```bash
pnpm first-take create my-video
pnpm first-take validate my-video/video.json
pnpm first-take still my-video/video.json --frame=0 --out=out/still.png
pnpm first-take render my-video/video.json --format=16x9
pnpm first-take preview my-video/video.json
```

By default, render/still print progress and errors only. Pass `--verbose` (global) for FFmpeg output and detailed phase logs. `--silent` / `--no-audio` mute audio in the encode — they do not quiet logging.

## Isolate a scene

Double-click a clip on the preview timeline. That mounts only that scene on a local clock. The sidebar inspector edits props as a live override; Save writes them to `video.json`. Back restores the full multi-lane timeline. Studio layout: [README.md § Preview](../README.md#preview).

## Sequences

Wrap timed sections in `<Sequence from={n} durationInFrames={d}>`. Inside, `useCurrentFrame()` is relative to that start — keep components reusable.
