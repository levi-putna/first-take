# Remotion research notes

Study notes from [Remotion](https://github.com/remotion-dev/remotion) public docs and architecture descriptions. Use these to guide Storyboard's **clean-room** design. Do not copy Remotion source into this repo; do not add Remotion dependencies.

Primary references:

- https://www.remotion.dev/docs
- https://www.remotion.dev/docs/the-fundamentals
- https://www.remotion.dev/docs/use-current-frame
- https://www.remotion.dev/docs/animating-properties
- https://www.remotion.dev/docs/flickering
- https://www.remotion.dev/docs/troubleshooting/css-animations
- https://www.remotion.dev/docs/interpolate
- https://www.remotion.dev/docs/series
- https://www.remotion.dev/docs/delay-render
- https://www.remotion.dev/docs/render
- https://github.com/remotion-dev/remotion

## 1. What Remotion gets right (adopt the idea)

### Frame as the clock

Remotion's core insight: give React a **frame number** and a blank canvas. Animation is changing props/styles as a function of that number ([fundamentals](https://www.remotion.dev/docs/the-fundamentals)).

### Determinism for parallel render

Frames render in parallel across tabs. Non-frame-driven animation flickers or freezes ([flickering](https://www.remotion.dev/docs/flickering)). Rules to enforce in Storyboard:

- Same visual every time for the same frame
- No reliance on order
- No animation while "paused"
- Controlled randomness only

### Ban CSS animations

Documented explicitly ([CSS animations](https://www.remotion.dev/docs/troubleshooting/css-animations)): transitions, keyframes, and timers do not know which frame is being captured.

### Composition metadata quartet

`width`, `height`, `fps`, `durationInFrames` define a renderable video. First frame `0`, last `durationInFrames - 1`.

### Relative sequences

`<Sequence from={n}>` makes `useCurrentFrame()` return time **relative to the sequence start**, so components stay reusable ([useCurrentFrame](https://www.remotion.dev/docs/use-current-frame)). `<Series>` stitches sequences back-to-back ([Series](https://www.remotion.dev/docs/series)); negative offsets allow overlays.

### interpolate + spring

Readable motion via range mapping and frame-based springs ([interpolate](https://www.remotion.dev/docs/interpolate)). Clamp extrapolation; express durations with `fps`.

### delayRender

Async work must block screenshot until ready ([delayRender](https://www.remotion.dev/docs/delay-render)). Media components should participate in this handshake.

### Render pipeline shape

Public architecture write-ups and docs describe:

1. Bundle React for the browser
2. Open headless Chromium
3. For each frame: set current frame → wait ready → screenshot
4. FFmpeg encodes images + audio

CLI, Node API, Lambda, and Studio are delivery modes around the same idea ([render](https://www.remotion.dev/docs/render)).

### Audio as layers with volume callbacks

Volume can be a function of frame for fades; trim/loop props place clips on the timeline. Studio may seek HTML audio if drift grows; **render** uses collected asset metadata for accurate muxing.

### Player vs render

`@remotion/player` embeds compositions in apps with runtime props - useful inspiration for Storyboard's component playground and future embeddable preview, implemented ourselves.

## 2. Remotion package map (orientation only)

From the monorepo layout (high level):

| Area | Responsibility |
|------|----------------|
| `packages/core` | Hooks, Sequence, compositions, interpolate, etc. |
| `packages/cli` | Studio + render CLI |
| `packages/renderer` | Bundle glue, browser, frames, stitch |
| `packages/media` / video tags | Frame-accurate media |
| `packages/transitions` | TransitionSeries presentations |
| `packages/player` | Embeddable player |
| `packages/lambda` | Distributed cloud render |

Storyboard's proposed packages mirror **responsibilities**, not APIs or code.

## 3. Where Storyboard deliberately diverges

| Remotion | Storyboard |
|----------|------------|
| Composition-centric programming model | Explicit **Component → Scene → Video JSON** layering for explainer pipelines |
| Often code-defined roots (`Root.tsx` compositions) | **JSON video file** as the stringer of scenes, transitions, global audio |
| Tight Studio product | CLI-first engine + simpler preview/playground MVP |
| Next.js brownfield recipes in the skill today | Engine **agnostic** of Next; skill may adapt later |
| Commercial license considerations | Independent implementation and licensing |
| Huge feature surface (3D, many transition types, Lambda…) | Narrow MVP aimed at narrated UI explainers |

## 4. Patterns to reimplement carefully

1. **Frame context React provider** - inject frame from renderer or preview scrubber.
2. **Sequence local time** - subtract `from`; unmount outside range.
3. **Asset ready gates** - prevent blank frames.
4. **Transition overlap math** - total duration ≠ naive sum.
5. **Concurrency pool** - correctness tests with `--concurrency=1` vs N.
6. **Still = render one frame** - QA path used heavily by the explainer skill.

## 5. Patterns to avoid copying blindly

- Remotion-specific ESLint plugin rules - write our own guidance/rules.
- Exact CLI flag names - choose Storyboard-native UX.
- Lambda / Cloud Run - out of MVP scope.
- Internal Remotion webpack quirks - prefer Vite/esbuild greenfield.
- Any verbatim source from the GitHub tree - license and clean-room policy.

## 6. Alignment with the explainer skill

The skill currently assumes Remotion APIs (`useCurrentFrame`, `TransitionSeries`, `OffthreadVideo`, `staticFile`, etc.). Storyboard's long-term fit:

- Same **mental model** (frame-driven React, scenes, series audio).
- Same **artefact shapes** (`scenes.json` timings, lead-in, formats).
- Different **import paths** (`@storyboard/core` instead of `remotion`).

When the engine matures, the skill's setup docs should be updated to Storyboard; until then, this `.doc` set is the bridge.

## 7. Research follow-ups (when implementing)

- [ ] Prototype Chromium frame injection + screenshot latency on Apple Silicon
- [ ] Compare Playwright vs Puppeteer-core for reliability
- [ ] Design off-thread video decoding strategy (native helper vs seek-per-frame)
- [ ] Specify volume envelope JSON schema for jingle/bed fades
- [ ] Draft `video.json` JSON Schema / Zod and a fixture from a real skill `scenes.json`
- [ ] Component playground UX sketch (props form + frame scrubber)

## 8. One-sentence takeaway

Remotion proves that **deterministic, frame-parameterised React** plus **headless Chromium screenshots** plus **FFmpeg** is a viable video engine; Storyboard adopts that architecture and specialises the authoring model around **testable components, scene data, and a JSON timeline** tuned for narrated explainers.
