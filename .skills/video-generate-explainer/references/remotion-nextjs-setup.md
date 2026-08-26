# Remotion in a Next.js project

This skill assumes Remotion is added to an **existing** Next.js project
("brownfield" install, per [Remotion's own docs](https://www.remotion.dev/docs/brownfield))
rather than a project scaffolded from scratch with `create-video`.

## One-time setup (Gate 0)

### Packages

```bash
npm install remotion @remotion/cli
npm install @remotion/media @remotion/transitions
# optional, only if needed by this production:
npm install @remotion/captions        # captions (Gate 5 step 4)
npm install @remotion/google-fonts    # non-system fonts (Gate 4)
npm install @visx/shape @visx/scale @visx/group @visx/axis @visx/grid @visx/curve  # chart geometry (Gate 4/6) - see data-visualization.md; never add react-spring alongside these
npm install -D @remotion/eslint-plugin
```

Use whatever package manager the project already uses (`yarn`/`pnpm`) - the
equivalent commands are `yarn add ...` / `pnpm add ...`.

### Folder + entry point

Create a `remotion/` folder at the project root, next to `app/`/`src/`:

```ts
// remotion/Root.tsx
import { Composition } from "remotion";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* One <Composition> per approved format is added here per
          production, at Gate 7 - see the main SKILL.md for the
          formats.map(...) pattern used when a production targets more
          than one aspect ratio. */}
    </>
  );
};
```

```ts
// remotion/index.ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

Check `tsconfig.json` doesn't have a `paths` alias that would shadow the
bare `remotion` package import with this local folder - Remotion's docs
call this out explicitly as a common brownfield-install mistake.

### Public folder

Remotion resolves local assets (`staticFile()`) through the project's
`public/` folder by default - the same `public/` Next.js already serves.
No `remotion.config.ts` `setPublicDir()` override is needed unless the
project's `public/` folder lives somewhere non-standard.

### Confirm it boots

```bash
npx remotion studio remotion/index.ts
```

### ESLint (optional but recommended)

```json
{
  "plugins": ["@remotion"],
  "overrides": [
    {
      "files": ["remotion/**/*.{ts,tsx}"],
      "extends": ["plugin:@remotion/recommended"]
    }
  ]
}
```

## Core primitives this skill relies on

### Animation - always frame-driven

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
  extrapolateRight: "clamp",
});
```

CSS transitions/animations and Tailwind animation classes are **forbidden**
- they do not render correctly in Remotion. Every value that changes over
time must come from `useCurrentFrame()`, `interpolate()`, or `spring()`.

`spring()` gives organic motion; store named presets in `shared/theme.ts`
rather than inventing config per scene:

```ts
// shared/theme.ts
export const motion = {
  enter: { damping: 200 },              // smooth, no bounce
  emphasis: { damping: 20, stiffness: 200 }, // snappy, minimal bounce
  playful: { damping: 8 },              // bouncy entrance
} as const;
```

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { motion } from "../shared/theme";

const scale = spring({ frame, fps, config: motion.enter });
```

Not sure what feel to target for a new preset? See
[content-formula.md](content-formula.md)'s "Motion values worth borrowing"
table for concrete, tested starting points (entrance duration, exit-vs-
entrance ratio, hover-lift distance, stagger interval) rather than guessing
a `damping`/`stiffness` combination from scratch.

### Sequencing scenes

Use `<Series>` for scenes with no visual transition between them, or
`<TransitionSeries>` (from `@remotion/transitions`) when a scene should
fade/slide/wipe into the next:

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={scenes[0].durationInFrames}>
    <Scene01 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={scenes[1].durationInFrames}>
    <Scene02 />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

Other presentations: `slide({direction: "from-left" | "from-right" | "from-top" | "from-bottom"})`,
`wipe()`, `flip()`, `clockWipe()`. Timing: `linearTiming({durationInFrames})`
or `springTiming({config})`.

**Important - total duration accounting:** a transition overlaps the two
scenes it sits between, so the composition's total `durationInFrames` is
the sum of every scene's `durationInFrames` **minus** the sum of every
transition's duration (via `timing.getDurationInFrames({fps})`), not a
plain sum. Compute this explicitly when setting the root `<Composition>`'s
`durationInFrames` at Gate 7 - don't just add up the scenes.

**Keep a continuous background outside the `<TransitionSeries>`, not
duplicated per scene.** If the Gate 4 background strategy is meant to feel
like one unbroken backdrop across scene changes (a look worth borrowing -
see [content-formula.md](content-formula.md)'s "connective tissue"
background technique), render it **once**, absolutely positioned behind
the whole `<TransitionSeries>`, rather than having each scene component
render its own copy:

```tsx
<AbsoluteFill>
  <Background /> {/* once, behind everything */}
  <TransitionSeries>
    {/* ...scenes, transparent/no-bg, transition over the shared backdrop... */}
  </TransitionSeries>
</AbsoluteFill>
```

This also reads as a cleaner cut: with `fade()`, two stacked copies of the
same background cross-dissolving into each other can subtly double up
(e.g. two overlapping glow/gradient layers briefly looking brighter than
either alone) - a single shared layer avoids that and is cheaper to render.
Only duplicate the background per scene if a scene's `visualNotes`
deliberately calls for the backdrop itself to change (a genuine scene-to-
scene background swap, not a continuity backdrop).

### Narration + series audio mix

Narration is still **one** continuous file from Gate 5, but it no longer
starts at composition frame 0 when series audio is enabled (Jumbo training
default). See [shared-audio-bed.md](shared-audio-bed.md).

```tsx
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { leadInFrames, seriesAudio } from "../shared/seriesAudio";
import { TrainingIntro } from "../shared/TrainingIntro";

const leadIn = leadInFrames(fps);

<AbsoluteFill>
  <Sequence durationInFrames={leadIn}>
    <TrainingIntro />
  </Sequence>
  <Sequence from={leadIn}>
    {/* TransitionSeries of content scenes timed to narration */}
  </Sequence>

  {/* Jingle: full during lead-in, fade out as VO starts */}
  <Sequence durationInFrames={leadIn + Math.round(seriesAudio.jingleFadeOutSeconds * fps)}>
    <Audio
      src={staticFile(seriesAudio.jingleSrc)}
      volume={(f) => {/* 1 → 0 across the fade window starting at leadIn */}}
    />
  </Sequence>

  {/* Narration starts after the ~4s lead-in */}
  <Sequence from={leadIn}>
    <Audio src={staticFile(`video/${slug}/narration.mp3`)} />
  </Sequence>

  {/* Soft bed loops under everything; duck under VO */}
  <Audio
    src={staticFile(seriesAudio.bedSrc)}
    loop
    volume={(f) => {/* lead-in quieter; under VO use bedVolumeUnderVo */}}
  />
</AbsoluteFill>
```

Place all three audio layers at the top level of `Composition.tsx`, outside
the content `<TransitionSeries>` - not once per scene. Scene visual
durations still come from Gate 5 alignment against the narration file;
offset the whole content block (and captions) by `leadInFrames`.

### Setting composition duration from the audio (alternative to summing scenes)

If you'd rather derive the root composition's duration directly from the
rendered narration file instead of summing scene durations, use
`calculateMetadata` with [Mediabunny](https://www.remotion.dev/docs) (a
separate `mediabunny` package):

```bash
npm install mediabunny
```

```ts
import { Input, ALL_FORMATS, UrlSource } from "mediabunny";
import type { CalculateMetadataFunction } from "remotion";

const getAudioDuration = async (src: string) => {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src, { getRetryDelay: () => null }) });
  return input.computeDuration();
};

export const calculateMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const durationInSeconds = await getAudioDuration(staticFile(`video/${props.slug}/narration.mp3`));
  return { durationInFrames: Math.ceil(durationInSeconds * fps) };
};
```

Either approach is valid; the scene-summing approach is preferred by
default because it's already derived from data you have in `scenes.json`
with no extra dependency - reach for `calculateMetadata`/Mediabunny mainly
if scene durations get hand-edited after the fact and could drift from the
audio length.

### Fonts

```bash
npm install @remotion/google-fonts   # or @remotion/fonts for local font files
```

```ts
// shared/theme.ts
import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
```

Load fonts once in `shared/theme.ts`, not per scene component.

### Assets

Anything in `public/` is referenced with `staticFile()`:

```tsx
import { Img, staticFile } from "remotion";
<Img src={staticFile("video/{slug}/logo.png")} />;
```

Remote URLs (`https://...`) can be used directly, without `staticFile()`.

### Real/generated video clips - `OffthreadVideo`

For `generated-video` and `real-video` scenes (Gate 6), use `OffthreadVideo`
from the core `"remotion"` package - not `<Video>` and not
`@remotion/media`'s video component. `OffthreadVideo` extracts frames
server-side during rendering, which is the reliable choice for a
deterministic final render (the other options are more prone to
frame-timing/seeking issues when rendering rather than just previewing):

```tsx
import { OffthreadVideo, staticFile } from "remotion";

<OffthreadVideo
  src={staticFile(`video/${slug}/generated/${sceneId}.mp4`)}
  muted={scene.videoSource.mute}
  // trim if the source clip is longer than the scene's durationInFrames needs -
  // consult the Remotion docs for the current trim prop names, they've moved
  // between versions (trimBefore/trimAfter vs startFrom/endAt)
/>;
```

Place it inside that scene's own component/`<TransitionSeries.Sequence>`
like any other scene content - it does not need special handling in
`Composition.tsx` beyond what any other scene gets. If the clip's native
audio is allowed to play for a wordless beat (see
production-quality-guidelines.md's audio-mixing section), don't set
`muted` - but do check the Remotion docs for volume/fade-control props if
you need to duck it in/out rather than hard-cut it.

### Captions (only if requested - see elevenlabs-narration-sync.md step 4)

```tsx
import { createTikTokStyleCaptions } from "@remotion/captions";
import { captions } from "../captions"; // precomputed at Gate 5

const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200,
});
```

Render each page in a `<Sequence>` positioned from `page.startMs`, and
highlight the active word by comparing `token.fromMs`/`token.toMs` against
the current absolute time - see the Remotion captions docs for the full
word-highlighting pattern.

## Rendering and reviewing

```bash
# Live preview / build scenes (Gate 6)
npx remotion studio remotion/index.ts

# Render a single still frame for the Gate 6 self-audit
npx remotion still remotion/index.ts {compositionId} out.png --frame={frameNumber}

# Final render (Gate 7)
npx remotion render remotion/index.ts {compositionId} public/video/{slug}/final.mp4
```

`{compositionId}` is the `id` given to the `<Composition>` registered in
`Root.tsx` for this production (this skill uses the production's `slug`).

## Charts and data visualization

Covered in its own reference doc, not here, since it has its own
category-specific animation patterns:
[references/data-visualization.md](data-visualization.md) (React/SVG vs.
visx, the `strokeDasharray`/`interpolate()` draw-on technique, and why
`@visx/xychart`'s `Animated*` components/`react-spring` must not be used).

## Cross-production shared components

`remotion/shared/` (project-wide, separate from a production's own
`shared/`) holds anything reused across more than one production - an
intro/outro, a chart primitive, a house cursor. See
[references/reusable-components.md](reusable-components.md) for what
belongs there and how a production's `theme.ts` extends it.

## Beyond this skill

This file covers only what the video-generate-explainer pipeline needs directly. For
anything else Remotion can do - 3D content (Three.js), Lottie animations,
Tailwind integration, video trimming/speed/pitch, GIFs, measuring text/DOM
nodes, transcribing existing audio - consult
[remotion.dev/docs](https://www.remotion.dev/docs) or the official
Remotion API skill (https://github.com/remotion-dev/skills) directly rather
than guessing at an API.
