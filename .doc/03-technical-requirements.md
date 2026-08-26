# Technical requirements

Stack and architecture choices for Storyboard. Remotion is a **reference**, not a dependency - we reimplement the patterns we need.

## 1. Architectural overview

```
                    ┌──────────────────┐
                    │  video.json      │
                    │  components/     │
                    │  assets/         │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌────────────┐  ┌──────────┐
        │ Validate │  │  Preview   │  │  Render  │
        │  schema  │  │  (Vite)    │  │   CLI    │
        └──────────┘  └────────────┘  └────┬─────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     ▼                     ▼                     ▼
              Bundle React           Headless Chromium      Collect audio
              (Vite / esbuild)       set frame → capture    timeline meta
                     │                     │                     │
                     └─────────────────────┴─────────────────────┘
                                           ▼
                                      FFmpeg encode
                                      → final.mp4
```

Inspired by Remotion's pipeline ([render docs](https://www.remotion.dev/docs/render), DeepWiki / architecture write-ups): **bundle → browser frames → FFmpeg**, with concurrency-safe React.

## 2. Runtime principles

1. **React is the scene graph** - DOM/CSS/SVG/Canvas that Chromium can paint becomes pixels.
2. **Frame injection** - before each capture, the page is told `currentFrame = n` (and composition id / props); React re-renders; screenshot.
3. **Concurrency** - pool of browser pages; frames may run out of order → authors must stay deterministic.
4. **Audio is metadata + files** - not painted; volume curves evaluated per frame or as envelopes, then mixed/encoded.

## 3. Proposed packages (monorepo)

Prefer a small monorepo so the core API can be imported by CLI and preview without circular mess. Yarn workspaces (per project convention: **yarn**, not npm).

| Package | Role |
|---------|------|
| `@levi-putna/storyboard-core` | Frame context, `useCurrentFrame`, `useVideoConfig`, `Sequence`, `Series`, `interpolate`, `spring`, `Easing`, `AbsoluteFill`, delay-render hooks |
| `@levi-putna/storyboard-media` | `Img`, `Audio`, `Video` (off-thread or seek-accurate strategy), `staticFile` helpers |
| `@levi-putna/storyboard-transitions` | Fade (v1); slide/wipe later |
| `@levi-putna/storyboard-renderer` | Bundle orchestration, Chromium control, frame capture, FFmpeg stitch, stills |
| `@levi-putna/storyboard` | `storyboard` binary: render, still, preview, validate |
| `@levi-putna/storyboard-preview` | Local studio / component playground UI |
| `@levi-putna/storyboard-schema` | Zod (or similar) schemas for `video.json`; types shared with CLI |

Application / demo package (optional early): `examples/hello-explainer` with sample components + JSON.

## 4. Language and platform

| Choice | Detail |
|--------|--------|
| Language | TypeScript (strict) |
| UI | React 19 (or current stable used by the host app) |
| Module | ESM |
| Node | Current LTS (document exact floor in README when locked) |
| Package manager | Yarn |
| OS | macOS (dev), Linux (CI) |

## 5. Key dependencies (intended)

These are **building blocks**, not Remotion:

### Required

| Dependency | Use |
|------------|-----|
| `react` / `react-dom` | Component model |
| `zod` | video.json validation |
| `commander` or `citty` / `yargs` | CLI parsing |
| `vite` or `esbuild` | Bundle compositions for the browser |
| `playwright` or `puppeteer-core` | Drive Chromium for screenshots |
| Chrome / Chromium | Paint engine (bundled browser fetch or system Chrome) |
| `ffmpeg` / `ffprobe` | Encode and probe (system binary or `@ffmpeg-installer`-style helper) |
| `execa` | Spawn FFmpeg / tools safely |

### Likely helpers

| Dependency | Use |
|------------|-----|
| `chalk` / `consola` | CLI output |
| `fs-extra` or Node `fs/promises` | File IO |
| `source-map-support` | Better render errors |
| `ws` | Preview hot reload bridge if needed |

### Explicitly excluded

| Package | Reason |
|---------|--------|
| `remotion` and all `@remotion/*` | Project must not import Remotion |
| Wall-clock animation libs as motion source | Breaks determinism (`react-spring`, etc.) |

Chart libs (e.g. visx) may appear in **content** projects that consume Storyboard; they are not core engine deps. If used in videos, animation must still be frame-driven.

## 6. Core API surface (v1 target)

Names can differ; behaviour should match these contracts:

```ts
/** Current frame relative to the nearest Sequence boundary. */
function useCurrentFrame(): number;

/** Composition metadata for the active render/preview. */
function useVideoConfig(): {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  id: string;
};

function interpolate(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: InterpolateOptions,
): number;

function spring(args: {
  frame: number;
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
  durationInFrames?: number;
}): number;

/** Shift local time for children; only mount while in range. */
function Sequence(props: {
  from?: number;
  durationInFrames?: number;
  children: React.ReactNode;
}): JSX.Element;

function Series(props: { children: React.ReactNode }): JSX.Element;
```

Plus: `AbsoluteFill`, `delayRender` / `continueRender` / `cancelRender`, media components, and a root registration API analogous to "register compositions" (list of videos / playground entries the CLI can discover).

## 7. Project layout (suggested)

```
storyboard/
  .doc/                     # this documentation
  .skills/                  # explainer skill (consumer of the engine)
  packages/
    core/
    media/
    transitions/
    renderer/
    cli/
    preview/
    schema/
  examples/
    hello-explainer/
      video.json
      src/
        Root.tsx
        Composition.tsx
        scenes/
        components/
      assets/
        audio/
        images/
  package.json              # yarn workspaces root
  README.md
```

Content projects (e.g. a Next.js app) may later vendor Storyboard and keep productions under their own tree; the engine itself should not assume Next.js.

## 8. video.json technical rules

- Validate with `@levi-putna/storyboard-schema` before render.
- Resolve component paths relative to the JSON file or a configured `rootDir`.
- Compute:

```
leadInFrames = round(leadInSeconds * fps)
contentFrames = sum(scene.durationInFrames) - sum(transition.durationInFrames)
totalFrames = leadInFrames + contentFrames + optionalTailFrames
```

- Reject configs where a transition is longer than either adjacent scene.
- Fail fast if referenced audio/image/video files are missing.

## 9. Renderer technical requirements

| Topic | Requirement |
|-------|-------------|
| Bundle | Produce a browser-loadable entry that mounts the selected composition. |
| Frame protocol | Inject frame + props into the page; wait for ready; screenshot viewport sized to composition. |
| Concurrency | Configurable page pool (default ~ CPU cores / 2); `--concurrency=1` for debugging. |
| Stills | Same path as one frame of render. |
| Image format | JPEG (fast) default for intermediate frames; PNG for stills / lossless debug. |
| Audio | Build an FFmpeg filter graph (or intermediate stems) from layers: trim, delay (lead-in), volume envelopes, loop bed. |
| Codecs | H.264 + AAC in MP4 for MVP. |
| Retries | Retry a frame if the browser tab crashes or delay-render times out (configurable). |

## 10. Preview technical requirements

- Vite-based app loading the same components as render.
- Timeline scrubber bound to `currentFrame` state (not wall-clock alone - play mode advances frame by `fps`).
- Component playground route: `/component/:id` with props editor.
- Must use the same `@levi-putna/storyboard-core` hooks so preview matches render.

## 11. Testing strategy

Normative detail lives in [08-testing-strategy.md](./08-testing-strategy.md). Summary:

| Layer | What |
|-------|------|
| Unit | `interpolate`, spring, duration math, schema parsing, scene timing helpers |
| Component | Render a component at frames 0, mid, end with `@testing-library` + fixed frame provider; assert styles / text |
| Golden stills | `renderStill` → `pixelmatch` against committed PNGs under `examples/*/expected/` |
| Integration | Short render (e.g. 30 frames) + ffprobe duration/audio stream checks; `yarn test:smoke` for hello-explainer |

## 12. Tooling

- ESLint + TypeScript
- Custom lint rule or docs checklist: ban CSS animation in `packages` examples and recommend frame APIs
- Prettier (or project standard)
- Changesets or simple semver for packages when publishing becomes relevant

## 13. Environment / system dependencies

| Dependency | Required for |
|------------|--------------|
| Node.js LTS | CLI, bundling |
| Yarn | Install |
| Chromium/Chrome | Frame paint |
| FFmpeg + ffprobe | Encode / probe |

Document install steps for macOS (`brew install ffmpeg`) and Linux CI images.

## 14. Security and licensing notes

- Remotion has a **company license** for some commercial uses - another reason to keep a clean-room inspired implementation and not copy their source verbatim. Study public docs and APIs; write our own code.
- Do not commit API keys; narration generation stays outside the engine.
- Treat user-supplied component code as trusted in local CLI (same trust model as running any local React app). Sandboxing cloud renders is a later concern.

## 15. Implementation phases (recommended)

1. **Core + preview** - frame context, interpolate, Sequence/Series, Vite playground, one example component.
2. **Schema + validate** - video.json, duration math, asset checks.
3. **Renderer MVP** - sequential then concurrent stills/frames + FFmpeg silent video.
4. **Audio mux** - narration + lead-in + bed envelopes.
5. **Transitions** - fade overlap.
6. **CLI polish** - multi-format, concurrency flags, examples aligned to explainer skill field names.
7. **Media primitives** - robust image/font/video waiting; off-thread video if needed.

## 16. Open technical decisions (to resolve during build)

1. Playwright vs Puppeteer-core for browser control.
2. Vite vs esbuild-only for the render bundle.
3. Whether compositions are discovered via a `registerRoot` pattern or only via video.json entry components.
4. Exact volume envelope representation: per-frame envelope in code (`volume` number or function → `volumePerFrame`); FFmpeg compiles it at encode time.
5. How aggressively to share Chromium binaries vs relying on system Chrome.
