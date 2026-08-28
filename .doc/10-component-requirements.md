# Component development requirements

Normative requirements for React modules used as **scene entries** or **shared
visuals** in a First Take video.

These modules are loaded from paths in [`video.json`](./06-video-json-schema.md)
(`tracks[].scenes[].component`) and rendered once per composition
frame during preview, still capture, and MP4 render.

Related reading:

| Doc | Role |
|-----|------|
| [01-core-concepts.md](./01-core-concepts.md) | Why frame-driven motion exists |
| [06-video-json-schema.md](./06-video-json-schema.md) | How components are referenced and timed |
| [07-authoring-guide.md](./07-authoring-guide.md) | Short how-to and CLI |
| [09-video-clips.md](./09-video-clips.md) | `<Video />` embedding rules |

---

## 1. Role of a component

A First Take component is a **pure visual function**:

```
pixels = f(localFrame, props, videoConfig)
```

| Input | Source |
|-------|--------|
| `localFrame` | `useCurrentFrame()` — relative to the scene / sequence start |
| `props` | From `video.json` (or live preview overrides) |
| `videoConfig` | `useVideoConfig()` — `fps`, `width`, `height`, `durationInFrames`, `id` |

Given the same inputs, frame *N* must always produce the same pixels. The
renderer may capture frames **out of order and in parallel**.

Components must **not**:

- Hardcode “I am scene 3 of this video”
- Own global timeline order (that belongs in `video.json`)
- Assume they run only in a real-time browser tab

---

## 2. Module contract

### 2.1 Export

| Requirement | Detail |
|-------------|--------|
| Default export | The module path in `video.json` must **default-export** a React function (or `forwardRef`) component |
| Named exports | Allowed for helpers / subcomponents; the entry used by the manifest is the default export |
| File type | `.tsx` / `.ts` / `.jsx` / `.js` as resolved by the Vite bundler used for render/preview |

### 2.2 Props

| Requirement | Detail |
|-------------|--------|
| JSON-serialisable | Props come from JSON — strings, numbers, booleans, plain objects/arrays only |
| Defaults | Provide sensible defaults so incomplete props still render |
| Typing | Type props in TypeScript; First Take does not validate prop shapes at validate-time |
| No scene coupling | Prefer generic names (`headline`, `items`) over video-specific globals |

```tsx
export default function HookScene({
  headline = "Fallback headline",
}: {
  headline?: string;
}) {
  // …
}
```

### 2.3 Layout root

Prefer wrapping the scene in `AbsoluteFill` from `first-take` so the
component fills the composition (`width` × `height`) without depending on
parent layout.

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "first-take";

export default function Scene(props: { title: string }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0e1524" }}>
      {/* … */}
    </AbsoluteFill>
  );
}
```

### 2.4 Responsive formats

`video.json` may list multiple formats (e.g. 16:9 and 9:16). Layout that must
work in both should read `width` / `height` from `useVideoConfig()` and size
type, padding, and positions from those values — not hardcode 1920×1080 only.

---

## 3. Motion and time (mandatory)

### 3.1 Required

- Drive **every** animated value from `useCurrentFrame()` or a pure function of
  it (`interpolate`, `spring`, `Easing`, manual maths).
- Author durations in **seconds × `fps`** so timing stays portable:

```tsx
const { fps } = useVideoConfig();
const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
  extrapolateRight: "clamp",
});
```

- Use `extrapolateRight: "clamp"` (and left when needed) so values do not drift
  after the intended range.
- Inside `<Sequence from={…}>`, treat `useCurrentFrame()` as **local** to that
  sequence so the component stays reusable.

### 3.2 Forbidden for motion that must survive render

| Forbidden | Why |
|-----------|-----|
| CSS `transition` / `animation` / `@keyframes` | Wall-clock; wrong under parallel capture |
| Tailwind `animate-*` | Same |
| `setTimeout` / `setInterval` / `requestAnimationFrame` for motion | Not frame-locked |
| `Date.now()` / `performance.now()` for animation | Non-deterministic across workers |
| Wall-clock spring libraries (e.g. react-spring) | Not a function of frame |

Decorative CSS that does **not** change over time (static shadows, static
gradients) is fine.

### 3.3 Randomness

If randomness is required, seed it from the frame (or a fixed seed + frame).
Uncontrolled `Math.random()` per render is forbidden.

### 3.4 Side effects

| Allowed | Caution |
|---------|---------|
| `delayRender` / `continueRender` / `cancelRender` for fonts, fetch, decode | Must resolve or cancel; never leave frames hanging |
| Registering media via `<Img>`, `<Audio>`, `<Video>` | Use First Take media primitives so capture waits for readiness |
| `useEffect` for non-visual bookkeeping | Must not drive motion or assume order of frames |

Do not fetch unique network content per frame without caching keyed by stable
inputs — parallel workers will thrash and diverge.

---

## 4. APIs you should use

### 4.1 `first-take`

| API | Use |
|-----|-----|
| `useCurrentFrame()` | Local frame index |
| `useAbsoluteFrame()` | Composition-global frame when needed |
| `useVideoConfig()` | `fps`, `width`, `height`, `durationInFrames`, `id` |
| `interpolate` | Map frame → style values |
| `spring` | Frame-driven spring progress |
| `Easing` | Easing helpers for interpolate |
| `AbsoluteFill` | Full-bleed layer |
| `Sequence` | Nested timed sections; resets local frame |
| `Series` | Sequential children |
| `delayRender` / `continueRender` / `cancelRender` | Async readiness handshake |

### 4.2 `first-take/media`

| API | Use |
|-----|-----|
| `Img` | Images that block capture until loaded |
| `Audio` | Timeline audio clips (volume may vary by frame) |
| `Video` | Real footage (offthread stills during render) — see [09-video-clips.md](./09-video-clips.md) |
| `staticFile` | Resolve a path under the project assets root for media `src` |

Prefer these over raw `<img>` / `<video>` / `<audio>` when the asset must be
frame-accurate in render.

### 4.3 `first-take/transitions`

Use only when composing multi-part visuals **inside** a component. Scene-to-scene
fades and wipes belong in scene components on overlapping tracks, not in `video.json`.

### 4.4 React

Use React 19 as declared by peer dependencies. Keep components function-based.
Avoid patterns that assume a single long-lived client session as the source of
visual truth.

---

## 5. Structure and reuse

### 5.1 Suggested split

| Kind | Location | Responsibility |
|------|----------|----------------|
| Scene entry | `src/scenes/*.tsx` | Default export referenced by `video.json`; thin props → layout |
| Shared chrome | `src/components/*.tsx` | Backgrounds, cards, marks reused across scenes |
| Lead-in | `src/components/LeadIn.tsx` (convention) | Brand hold during series lead-in |

Continuity comes from **shared components + props**, not from re-describing the
same UI in every scene.

### 5.2 Sequences inside a scene

For multi-beat motion within one `durationInFrames`:

```tsx
<Sequence from={0} durationInFrames={0.5 * fps}>
  <IntroBit />
</Sequence>
<Sequence from={Math.round(0.5 * fps)} durationInFrames={rest}>
  <MainBit />
</Sequence>
```

Each child still obeys §3.

### 5.3 Isolate in preview

Double-click a timeline clip to render only that scene on a local clock.
Sidebar prop edits are live overrides; Save writes them to `video.json`.
Studio layout: [README.md § Preview](../README.md#preview).

---

## 6. Assets and readiness

1. Put static media under the project `assets/` tree (or paths you pass to
   `staticFile` / media `src`).
2. Jingle / bed / narration are `<Audio>` clips inside scenes; pass file paths
   as props. `validate` scans string props ending in audio extensions.
3. Scene-local SFX or overlays may use `<Audio>` / `<Img>` / `<Video>` in the
   component tree.
4. Never leave a loading spinner as the final captured frame — use media
   primitives or `delayRender` until ready.
5. Fonts: load before relying on metrics; delay render until font readiness if
   layout depends on them.

---

## 7. Testing expectations

Components should be testable without a full MP4 encode:

| Level | Expectation |
|-------|-------------|
| Unit / RTL | Mount under a frame provider; assert text/styles at frames 0, mid, end |
| Golden still | Project fixtures may capture known frames for pixel diffs |
| Isolate | Double-click a clip; scrub with current props |

Avoid assertions that depend on wall-clock timing.

---

## 8. Compliance checklist

Authors and agents should confirm before shipping a scene module:

- [ ] Default-exported React component
- [ ] Props are JSON-friendly with defaults
- [ ] Root fills the frame (`AbsoluteFill` or equivalent)
- [ ] All motion derived from `useCurrentFrame()` / pure helpers
- [ ] No CSS / Tailwind / rAF / wall-clock animation for motion
- [ ] Multi-format layout uses `width` / `height` from `useVideoConfig()`
- [ ] Media uses `first-take/media` where capture readiness matters
- [ ] No hard dependency on global scene index or sibling scenes
- [ ] Works when isolated from the timeline with the scene’s props
- [ ] Documented with a short JSDoc on the component

---

## 9. Non-goals

Component requirements do **not** currently include:

- A separate visual design system (tokens are project-local)
- Runtime prop validation against JSON Schema
- Sandboxing untrusted component code (local CLI trusts project code)
- Remotion package imports — use `@storyboard/*` only
