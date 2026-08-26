# Authoring guide

Practical how-to for writing videos. Normative contracts:

- Scene / video file: [06-video-json-schema.md](./06-video-json-schema.md)
- Component requirements: [10-component-requirements.md](./10-component-requirements.md)

## Frame-driven motion

Every animated value must come from `useCurrentFrame()` (or a pure function of it). Remotion-style rules apply — see [01-core-concepts.md](./01-core-concepts.md) and the full checklist in [10-component-requirements.md](./10-component-requirements.md).

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "@storyboard/core";

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
  playground.ts          # optional — component playground entries
  src/
    scenes/
    components/
  assets/
    audio/
```

Scaffold that layout with:

```bash
yarn storyboard create my-video
```

## CLI

```bash
yarn storyboard create my-video
yarn storyboard validate my-video/video.json
yarn storyboard still my-video/video.json --frame=0 --out=out/still.png
yarn storyboard render my-video/video.json --format=16x9
yarn storyboard preview my-video/video.json
```

By default, render/still print progress and errors only. Pass `--verbose` (global) for FFmpeg output and detailed phase logs. `--silent` / `--no-audio` mute audio in the encode — they do not quiet logging.
## Playground

Export `playground` from `playground.ts`:

```ts
export const playground = [
  {
    id: "TitleCard",
    component: TitleCard,
    defaultProps: { headline: "Hello" },
    durationInFrames: 90,
  },
];
```

Applying new props in the preview UI resets the local frame to `0` and re-runs the animation.

## Sequences

Wrap timed sections in `<Sequence from={n} durationInFrames={d}>`. Inside, `useCurrentFrame()` is relative to that start — keep components reusable.
