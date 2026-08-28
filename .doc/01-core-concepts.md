# Core concepts

These concepts are the foundation of First Take. They are heavily informed by Remotion's model ([The fundamentals](https://www.remotion.dev/docs/the-fundamentals), [useCurrentFrame](https://www.remotion.dev/docs/use-current-frame), [Flickering](https://www.remotion.dev/docs/flickering)), re-expressed for an engine we own.

## 1. A video is a function of frame → image

A video is a sequence of images over time. First Take does not "play" React in real time and record the screen. Instead:

1. Fix `fps`, `width`, `height`, and `durationInFrames`.
2. For each integer frame `f` from `0` to `durationInFrames - 1`, render the React tree as if the clock is exactly at frame `f`.
3. Capture that visual (plus any audio samples that belong to that time).
4. Encode the image sequence and audio into a media file.

**Implication:** animation must be a **pure function of the frame number** (and props / config). Given the same inputs, frame 42 must always look identical.

```
visual(frame, props, videoConfig) → pixels
```

This is the single most important rule inherited from Remotion.

## 2. Time is discrete: frames and fps

| Property | Meaning |
|----------|---------|
| `fps` | Frames per second (typical: 30) |
| `durationInFrames` | Length of a composition or scene in frames |
| `frame` | Current index; first frame is `0`, last is `durationInFrames - 1` |
| Seconds | `frame / fps` (and `seconds * fps` when converting from audio) |

Author motion in **seconds**, then convert with `fps` so timing stays portable across frame rates:

```
fadeInFrames = 0.5 * fps   // half a second, regardless of 24 vs 30 fps
```

## 3. Determinism and concurrent rendering

Remotion renders frames **out of order and in parallel** across browser tabs ([Flickering docs](https://www.remotion.dev/docs/flickering)). First Take should do the same for speed.

Therefore a component must satisfy:

1. **Same frame → same pixels** every time it is called.
2. **No dependence on render order** - frame 50 may be captured before frame 10.
3. **No wall-clock animation** when paused or when frames are skipped.
4. **No uncontrolled randomness** - if randomness is needed, seed it from the frame (or a fixed seed + frame).

### Forbidden motion drivers

These look fine in a browser tab but break frame-accurate capture:

- CSS `transition` / `animation` / `@keyframes`
- Tailwind `animate-*` classes
- `setTimeout` / `requestAnimationFrame` / `Date.now()` for motion
- Spring libraries driven by wall-clock time (e.g. react-spring)

### Required motion drivers

- Current frame from the engine (First Take equivalent of `useCurrentFrame()`)
- Video config (`fps`, dimensions, duration)
- Pure helpers: `interpolate`, easing, spring-from-frame

## 4. Layer model: Component → Scene → Video

First Take splits Remotion's flat "composition" idea into explicit layers:

```
┌─────────────────────────────────────────────────────────┐
│  Video (JSON manifest)                                  │
│  formats, fps, tracks[]                                 │
├─────────────────────────────────────────────────────────┤
│  Track                                                  │
│  stacked lane; index 0 paints on the bottom             │
├─────────────────────────────────────────────────────────┤
│  Scene                                                  │
│  duration, gap, props, which component                  │
├─────────────────────────────────────────────────────────┤
│  Component (pure React)                                 │
│  props in → frame-driven visual (and optional Audio)    │
└─────────────────────────────────────────────────────────┘
```

### Component

- A normal React component.
- Receives **props** (copy, mock data, theme tokens, motion knobs).
- Reads **local frame** (relative to when this component's sequence starts) to drive animation.
- Can be mounted alone in a preview / Storybook-style harness with different props; changing props restarts the animation - that is intentional.
- Must not hardcode "I am scene 3 of video X".

### Scene

- Selects one or more components and supplies **scene-specific data**.
- Owns (or inherits) `durationInFrames` for that beat.
- Corresponds to one spoken beat in an explainer (see timing doc).
- May be `component`, or later `generated-video` / `real-video` wrappers for clips.

### Video

- Described by a **JSON file** (the single source of timeline truth).
- Lists scenes in order, transitions between them, formats (16:9, 9:16, …), and **overarching assets** (narration track, intro jingle, soft bed).
- Total duration is computed from scenes, transition overlaps, and lead-in - not guessed at render time.

## 5. Relative time (sequences)

When a component is placed on the timeline starting at global frame `from`, its **local frame** is:

```
localFrame = globalFrame - from
```

(clamped / only mounted while `localFrame` is inside the sequence's duration).

That lets reusable components always animate from local `0`, regardless of where they sit in the video - the same idea as Remotion's `<Sequence>` resetting `useCurrentFrame()` ([docs](https://www.remotion.dev/docs/use-current-frame)).

Scenes are typically sequences in series (back-to-back). Transitions may **overlap** two scenes for N frames, which shortens total duration by N relative to a naive sum.

## 6. Interpolation and springs

### Interpolate

Map a frame (or any number) through input and output ranges:

```
opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
```

Use clamping so values do not keep growing past the intended range. Prefer writing durations in seconds × `fps`. Easing belongs on the interpolate options (bezier curves that can match CSS cubic-bezier when designers share curves).

### Spring (frame-driven)

A spring is not a timer - it is a **math function of frame and fps** that returns a progress value (often 0→1). Named presets (enter, emphasis, playful) should live in theme tokens, not reinvented per scene.

## 7. Composition metadata

Every renderable video needs four numbers (Remotion composition model):

- `width`, `height`
- `fps`
- `durationInFrames`

Multiple **formats** (aspect ratios) can share the same timeline and audio; only layout reads `width`/`height`. Narration timing does not change per format.

## 8. Assets and readiness

Frames must not capture a loading spinner. Patterns Remotion uses that we should reimplement:

- Media primitives (`Img`, `Video`, `Audio`) that block capture until ready
- An explicit **delay render / continue render** handshake for async work (fonts, fetch, decode)
- Prefer resolving fonts and static assets before capture proceeds

Audio is collected as a **timeline of clips** (src, start frame, trim, volume curve, loop) and muxed at encode time - volume can be a function of frame for fades and ducking.

## 9. Preview vs render

| Mode | Behaviour |
|------|-----------|
| Preview / studio | Scrub timeline, play at real-ish speed, hot reload components, override props |
| Still | Capture one frame for QA |
| Render | Parallel frame capture → encode |

Preview can feel real-time; **render correctness still depends only on the frame function**. Preview is for authoring; render is the contract.

## 10. Continuity by structure, not by prompt

For explainers, recurring visuals (background, chrome, cards) live in **shared components** imported by many scenes. Continuity is structural: one component, many props - not "describe the same desk again hoping the model matches".

That principle comes from the explainer skill and fits naturally with a React video engine.

## Summary checklist for authors

- [ ] Every animated value comes from the current frame (or a pure function of it)
- [ ] Components are prop-driven and previewable in isolation
- [ ] Scenes supply data + duration; they do not reinvent shared chrome
- [ ] Video JSON owns order, transitions, formats, and global audio
- [ ] Seconds × fps for portable timing; speech alignment owns narrated scene lengths
- [ ] No CSS / wall-clock animation for motion that must survive render
