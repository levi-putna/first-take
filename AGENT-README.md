# Agent guide: generate a Storyboard video

Read this before scaffolding a video, writing scene components, or editing `video.json`.

This file is for **agents**. Humans can follow it too. Normative specs live under [`.doc/`](.doc/); this page is the operational playbook.

**Do not import Remotion.** Use `@levi-putna/storyboard-core`, `@levi-putna/storyboard-media`, and `@levi-putna/storyboard-transitions` only.

---

## Mental model

```
pixels = f(localFrame, props, videoConfig)
```

A video is not a screen recording of React. The renderer evaluates the tree at integer frames, possibly **out of order and in parallel**. Same inputs must always produce the same pixels.

Three layers, never mixed:

| Layer | Owns | Lives in |
|-------|------|----------|
| **Video** | Order, timing, formats, series audio, which modules to load | `video.json` |
| **Scene** | One timeline beat: duration, props, optional narration window | One object in `scenes[]` |
| **Component** | Frame-driven pixels from props | Default-exported `.tsx` |

Components must not hardcode global scene order, sibling scenes, or composition length. Continuity comes from **shared components + props**, not from re-describing the same UI in every scene.

---

## Workflow

Pick a working directory first.

| Context | CLI | Where `create` writes |
|---------|-----|------------------------|
| This monorepo | `yarn storyboard` | `examples/<slug>/` (then `yarn install` to link the workspace) |
| A consumer project | `npx @levi-putna/storyboard` | `./<slug>/` |

Then:

1. **Scaffold** (or copy the closest example under [`examples/`](./examples/)).
2. **Write shared chrome** (`src/components/`) before scene-specific motion.
3. **Write scene entries** (`src/scenes/*.tsx`): default export, JSON-friendly props, `AbsoluteFill` root.
4. **Register** each scene in `video.json` (`component` path relative to the JSON file, `props`, `durationInFrames`).
5. **Register playground** entries in `playground.ts` so preview can isolate a component.
6. **Validate**, capture **stills** at start / mid / end, then **preview**, then **render**.

```bash
# monorepo
yarn storyboard create my-video --title "My Video"
yarn install
yarn storyboard validate examples/my-video/video.json
yarn storyboard still examples/my-video/video.json --frame=0 --out=out/still.png
yarn storyboard preview examples/my-video/video.json
yarn storyboard render examples/my-video/video.json --format=16x9
```

```bash
# consumer project
npx @levi-putna/storyboard create my-video --title "My Video"
cd my-video && yarn install
npx @levi-putna/storyboard validate video.json
npx @levi-putna/storyboard still video.json --frame=0 --out=out/still.png
npx @levi-putna/storyboard preview video.json
npx @levi-putna/storyboard render video.json --format=16x9
```

`--with-audio` on `create` adds `seriesAudio` fields pointing at `assets/audio/`. `--force` overwrites a non-empty folder.

---

## Project layout

```
my-video/
  video.json                 # timeline source of truth
  playground.ts              # isolated component preview registry
  package.json
  src/
    scenes/                  # default-export scene entries referenced by video.json
    components/              # shared chrome + lead-in bumper
  assets/
    audio/                   # jingle, bed, narration (seriesAudio paths)
    clips/                   # real footage for <Video />
```

Component paths in `video.json` resolve relative to the JSON file, **not** `assetsRoot`. Audio paths resolve as `dirname(video.json) / assetsRoot / path`.

---

## Building a component

### Contract

| Requirement | Detail |
|-------------|--------|
| Default export | The path in `video.json` must default-export a React function component |
| Props | JSON-serialisable only (strings, numbers, booleans, plain objects/arrays). Provide defaults |
| Root | Wrap in `AbsoluteFill` so the scene fills `width × height` |
| Motion | Every animated value comes from `useCurrentFrame()` or a pure function of it |
| Layout | Size from `useVideoConfig().width` / `.height`. Do not hardcode 1920×1080 |
| JSDoc | Short block on the component |

### Forbidden for motion that must survive render

- CSS `transition` / `animation` / `@keyframes` / Tailwind `animate-*`
- `setTimeout` / `setInterval` / `requestAnimationFrame` / `Date.now()` for motion
- Wall-clock springs (`react-spring` and similar)
- Uncontrolled `Math.random()` (seed from frame if randomness is required)
- `import` from `remotion` or `@remotion/*`

Static CSS (solid colours, static shadows, static gradients) is fine.

### Template

```tsx
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

/**
 * Opening hook: headline fades and rises into place.
 */
export default function HookScene({
  headline = "Fallback headline",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Author durations in seconds × fps so timing stays portable.
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.5 * fps], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0e1524",
        alignItems: "center",
        justifyContent: "center",
        padding: width * 0.08,
      }}
    >
      {/* Headline */}
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          color: "#f2f5fb",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(36, width * 0.045),
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  );
}
```

Copy motion patterns from [`examples/motion-lab`](./examples/motion-lab/) (typewriter, float, pulse, slide, stagger, spring, progress, rotate). Copy a full explainer from [`examples/hello-explainer`](./examples/hello-explainer/).

### Motion APIs (`@levi-putna/storyboard-core`)

| API | Use |
|-----|-----|
| `useCurrentFrame()` | Local frame (0 at scene / sequence start) |
| `useAbsoluteFrame()` | Composition-global frame when needed |
| `useVideoConfig()` | `fps`, `width`, `height`, `durationInFrames`, `id` |
| `interpolate(input, inputRange, outputRange, options)` | Map frame → number. Always pass `extrapolateRight: "clamp"` unless you intend overshoot |
| `spring({ frame, fps, from, to, durationInFrames, config })` | Frame-driven spring. Not wall-clock |
| `Easing` | `linear`, `quad`, `cubic`, `in` / `out` / `inOut`, `bezier(x1,y1,x2,y2)` for `interpolate` |
| `AbsoluteFill` | Full-bleed layer |
| `Sequence` | Nested timed section; `useCurrentFrame()` is **local** to `from` |
| `Series` | Sequential children |

Multi-beat motion inside one scene:

```tsx
<Sequence from={0} durationInFrames={Math.round(0.5 * fps)}>
  <IntroBit />
</Sequence>
<Sequence from={Math.round(0.5 * fps)} durationInFrames={rest}>
  <MainBit />
</Sequence>
```

Scene-to-scene fades belong in `video.json` `transitionIn`, not ad hoc inside every scene, unless you are building a custom in-component transition.

### Media (`@levi-putna/storyboard-media`)

Prefer these over raw `<img>` / `<video>` / `<audio>` so capture waits for readiness.

| API | Use |
|-----|-----|
| `staticFile("assets/…")` | Resolve a path under the project (no leading slash needed) |
| `Img` | Images; blocks capture until loaded |
| `Audio` | Scene-local SFX / beds. `volume` may be a number or `(localFrame) => number` |
| `Video` | Real footage. `startFrom` / `endAt` are **seconds in the source file**. Composition duration is still `durationInFrames` in JSON |

`visualType` in `video.json` is always `"component"`. Real footage is **inside** a component via `<Video />`, never a reserved `real-video` scene type (rejected in schema v1).

Mute clip audio under series narration unless the beat is meant to be heard.

```tsx
import { staticFile, Video } from "@levi-putna/storyboard-media";

<Video
  src={staticFile("assets/clips/broll.mp4")}
  startFrom={10}
  endAt={30}
  muted
  objectFit="cover"
/>
```

Clip examples: [`clip-trim-fullscreen`](./examples/clip-trim-fullscreen/), [`clip-pip-presenter`](./examples/clip-pip-presenter/), [`clip-overlay-shapes`](./examples/clip-overlay-shapes/), [`clip-zoom-presenter`](./examples/clip-zoom-presenter/), [`clip-hard-cut`](./examples/clip-hard-cut/), [`clip-sound-move`](./examples/clip-sound-move/).

### Playground

Export `playground` from `playground.ts` next to `video.json`. Changing props in the UI restarts the local animation from frame 0. That is intentional.

```ts
export const playground = [
  {
    id: "Hook",
    component: HookScene,
    defaultProps: { headline: "You hit Tab. Nothing highlights." },
    durationInFrames: 90,
  },
];
```

---

## Using components from `video.json`

Schema v1. Full field list: [`.doc/06-video-json-schema.md`](.doc/06-video-json-schema.md).

### Minimal silent video

```json
{
  "schemaVersion": 1,
  "slug": "my-video",
  "title": "My Video",
  "fps": 30,
  "formats": [
    { "id": "16x9", "aspectRatio": "16:9", "width": 1920, "height": 1080 }
  ],
  "scenes": [
    {
      "id": "01",
      "title": "Hook",
      "visualType": "component",
      "component": "src/scenes/01-Hook.tsx",
      "props": { "headline": "You hit Tab. Nothing highlights." },
      "durationInFrames": 90,
      "transitionIn": null
    }
  ]
}
```

### Scene fields agents actually set

| Field | Rule |
|-------|------|
| `id` | Stable string (`"01"`, `"hook"`). Unique recommended |
| `component` | Path relative to `video.json`. Module must default-export |
| `props` | Arbitrary JSON. Storyboard does **not** type-check props |
| `durationInFrames` | Local length. For narrated scenes, derive from speech (below) |
| `transitionIn` | First scene: `null`. Later: `{ "type": "fade", "durationInFrames": 15 }` or `null` (hard cut) |
| `audioStartSeconds` / `audioEndSeconds` | Clocks on the **narration file**, not the composition |
| `narration` | Script slice for this beat (docs / tooling). Does not play audio by itself |

Fade overlap rules (enforced by `validate`):

- Fade length `t` must be **strictly less than** the previous scene’s `durationInFrames`
- And **strictly less than** this scene’s `durationInFrames`

All formats share fps, scenes, and audio. Only layout that reads `useVideoConfig()` should differ.

### Duration math

```
leadInFrames  = round((seriesAudio.leadInSeconds ?? 0) * fps)
contentFrames = sum(scene.durationInFrames) - sum(fade overlaps after the first scene)
tailFrames    = round((seriesAudio.tailSeconds ?? 0) * fps)
totalFrames   = leadInFrames + contentFrames + tailFrames
```

Seconds ↔ frames: `round(seconds * fps)` and `frame / fps`. Default fps is **30**.

### Narrated explainers (audio-first)

Picture follows speech. Do not invent narrated scene lengths when alignment exists.

1. One continuous narration file for the whole body script (not one file per scene).
2. Walk alignment to set each scene’s `audioStartSeconds` / `audioEndSeconds`.
3. Set duration with a small lead-out so cuts are not clipped:

```
LEAD_OUT_FRAMES ≈ 3–5
durationInFrames = round((audioEndSeconds - audioStartSeconds) * fps) + LEAD_OUT_FRAMES
```

4. Keep those seconds relative to `narration.mp3`. Composition content starts after `leadInFrames` (typically 4s → 120 frames at 30fps).

Declare series mix on the **root**, not inside every scene:

```json
"leadIn": {
  "component": "src/components/LeadIn.tsx",
  "props": { "label": "Storyboard" }
},
"seriesAudio": {
  "leadInSeconds": 4,
  "jingle": "assets/audio/intro-jingle.mp3",
  "bed": "assets/audio/bed-loop.mp3",
  "narration": "assets/audio/narration.mp3",
  "jingleVolume": 0.55,
  "bedVolumeUnderVo": 0.12,
  "bedVolumeLeadIn": 0.08,
  "jingleFadeOutSeconds": 0.6,
  "bedFadeInSeconds": 0.8,
  "bedFadeOutSeconds": 1.2,
  "tailSeconds": 0.5
}
```

Any of `jingle` / `bed` / `narration` that is set must exist on disk (`validate` checks this unless `--no-assets`).

Worked files: [`examples/hello-explainer/video.json`](./examples/hello-explainer/video.json), [`examples/audio-mix`](./examples/audio-mix/), [`examples/audio-volume-fade`](./examples/audio-volume-fade/). Timing model: [`.doc/04-timing-and-audio.md`](.doc/04-timing-and-audio.md).

---

## CLI (what to run, when)

| Command | When |
|---------|------|
| `create <slug>` | New project. `--dir`, `--title`, `--with-audio`, `--force` |
| `validate <video.json>` | After every JSON or asset path change. Catches schema, fade math, missing audio |
| `still <video.json> --frame=N` | Self-audit a scene. Capture start, mid, and end before presenting |
| `preview <video.json>` | Studio + playground. `--port`, `--no-open` |
| `render <video.json>` | Encode MP4. `--format=16x9\|all`, `--out`, `--concurrency`, `--keep-frames` |

`--silent` / `--no-audio` mute **encode** audio. They do not quiet logs. `--verbose` prints FFmpeg and phase detail.

Rendered files land in `out/` (for example `out/my-video-16x9.mp4`). Pin a path with `--out=out/hello.mp4`.

Validate does **not** execute components or type-check props. Broken motion only shows up in still / preview / render.

---

## Which example to copy

| Job | Start from |
|-----|------------|
| Full dual-format explainer with series audio | [`examples/hello-explainer`](./examples/hello-explainer/) |
| Frame-driven motion catalogue | [`examples/motion-lab`](./examples/motion-lab/) |
| Smallest interpolate + spring | [`examples/motion-basics`](./examples/motion-basics/) |
| Fade overlap math | [`examples/fade-overlap`](./examples/fade-overlap/) |
| 16:9 + 9:16 | [`examples/multi-format`](./examples/multi-format/) |
| Series jingle / bed / narration | [`examples/audio-mix`](./examples/audio-mix/) |
| Frame-varying `Audio` volume | [`examples/audio-volume-fade`](./examples/audio-volume-fade/) |
| Trimmed full-screen clip | [`examples/clip-trim-fullscreen`](./examples/clip-trim-fullscreen/) |
| Presenter PIP + graphics | [`examples/clip-pip-presenter`](./examples/clip-pip-presenter/) |
| Shapes over footage | [`examples/clip-overlay-shapes`](./examples/clip-overlay-shapes/) |
| Ken Burns zoom | [`examples/clip-zoom-presenter`](./examples/clip-zoom-presenter/) |
| Hard cut between clips | [`examples/clip-hard-cut`](./examples/clip-hard-cut/) |
| Moving clip with sound | [`examples/clip-sound-move`](./examples/clip-sound-move/) |

Descriptions: [README.md](./README.md#examples).

---

## Agent checklist

Before presenting a scene or render:

- [ ] Default-exported React component; props JSON-friendly with defaults
- [ ] Root fills the frame (`AbsoluteFill` or equivalent)
- [ ] All motion from `useCurrentFrame()` / `interpolate` / `spring` / `Easing`
- [ ] No CSS / Tailwind / rAF / wall-clock animation for motion
- [ ] Multi-format layout uses `width` / `height` from `useVideoConfig()`
- [ ] Media uses `@levi-putna/storyboard-media` (`staticFile`, `Img`, `Audio`, `Video`)
- [ ] No Remotion imports; no hard-coded scene index or sibling scenes
- [ ] Playground entry with `defaultProps`
- [ ] `video.json` paths resolve; first `transitionIn` is `null`; fade lengths are legal
- [ ] Narrated durations derived from alignment + lead-out, not guessed
- [ ] `validate` passes; stills captured at start / mid / end look correct
- [ ] Shared chrome lives in `src/components/`, not copy-pasted per scene

---

## Normative docs

| Doc | When to open it |
|-----|-----------------|
| [`.doc/01-core-concepts.md`](.doc/01-core-concepts.md) | Why frame-driven motion exists |
| [`.doc/06-video-json-schema.md`](.doc/06-video-json-schema.md) | Every `video.json` field |
| [`.doc/07-authoring-guide.md`](.doc/07-authoring-guide.md) | Short human how-to |
| [`.doc/10-component-requirements.md`](.doc/10-component-requirements.md) | Component contract |
| [`.doc/04-timing-and-audio.md`](.doc/04-timing-and-audio.md) | Narration clocks vs composition clocks |
| [`.doc/09-video-clips.md`](.doc/09-video-clips.md) | `<Video />` trim / PIP / overlays |
| [`.claude/skills/video-generate-explainer/SKILL.md`](.claude/skills/video-generate-explainer/SKILL.md) | Gated explainer production pipeline (brief → script → scenes → render) |
