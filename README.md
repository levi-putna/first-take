# Storyboard

Frame-deterministic React video engine for explainer videos. Inspired by Remotion patterns, implemented as an independent codebase — no Remotion packages are imported.

See [`.doc/`](.doc/) for architecture, requirements, and timing model.

## Prerequisites

| Tool | Notes |
|------|--------|
| Node.js 22+ | `node -v` |
| Yarn 1.x | `yarn -v` |
| FFmpeg + ffprobe | `brew install ffmpeg` on macOS |
| Chromium | Downloaded automatically via Playwright on first render |

## Install

```bash
yarn install
yarn build
# first render downloads Chromium:
yarn workspace @storyboard/renderer exec playwright install chromium
```

## Build a video

Fastest path: render the included example.

```bash
# validate the manifest and assets
yarn storyboard validate examples/hello-explainer/video.json

# optional — scrub in the browser
yarn storyboard preview examples/hello-explainer/video.json

# optional — capture one frame for QA
yarn storyboard still examples/hello-explainer/video.json --frame=0 --out=out/still.png

# render MP4(s) — default is every format in video.json
yarn storyboard render examples/hello-explainer/video.json

# or one format / custom output path
yarn storyboard render examples/hello-explainer/video.json --format=16x9 --out=out/hello.mp4
```

Outputs land in `out/` (for example `out/hello-explainer-16x9.mp4`). Useful render flags: `--concurrency=N`, `--silent` / `--no-audio` (mute audio), `--keep-frames`, `--verbose` (FFmpeg + detailed progress).

### Author your own

Scaffold a new project (creates `examples/<slug>/` when run from the repo root):

```bash
yarn storyboard create my-feature
# optional audio paths in video.json:
yarn storyboard create my-feature --with-audio --force
```

That writes `video.json`, lead-in + two scene components, `playground.ts`, `package.json`, and `assets/audio/`.

Then:

```bash
yarn install
yarn storyboard validate examples/my-feature/video.json
yarn storyboard preview examples/my-feature/video.json
yarn storyboard render examples/my-feature/video.json
```

1. Edit scenes under `src/scenes/` and the bumper under `src/components/LeadIn.tsx`.
2. Adjust timeline, formats, and props in `video.json`. Spec: [`.doc/06-video-json-schema.md`](.doc/06-video-json-schema.md).
3. Optional: drop MP3s into `assets/audio/` (see that folder's README) and enable `seriesAudio`.

More detail: [`.doc/07-authoring-guide.md`](.doc/07-authoring-guide.md).  
Component requirements: [`.doc/10-component-requirements.md`](.doc/10-component-requirements.md).  
Real video clips (trim / PIP / overlays): [`.doc/09-video-clips.md`](.doc/09-video-clips.md).

## CLI

```bash
yarn storyboard create <slug> [--dir=path] [--title=...] [--with-audio] [--force]
yarn storyboard validate <video.json>
yarn storyboard still <video.json> --frame=N --out=out/still.png
yarn storyboard render <video.json> [--format=16x9|all] [--out=path.mp4] [--verbose]
yarn storyboard preview <video.json>
```

Global flag: `--verbose` shows FFmpeg output and detailed phase logs. By default the CLI only prints progress and errors.
## Packages

| Package | Role |
|---------|------|
| `@storyboard/schema` | `video.json` Zod schema and duration helpers |
| `@storyboard/core` | Frame context, Sequence, interpolate, spring, composition |
| `@storyboard/media` | Img, Audio, staticFile |
| `@storyboard/transitions` | Fade TransitionSeries |
| `@storyboard/renderer` | Vite bundle, Playwright capture, FFmpeg encode |
| `@storyboard/preview` | Studio + component playground |
| `@storyboard/cli` | `storyboard` binary |

## Authoring rules

- Drive all motion from `useCurrentFrame()` — never CSS transitions/animations.
- Scenes are pure React components with props; `video.json` owns timeline and audio.
- Changing playground props restarts the animation from frame 0 (intentional).

## Licence

Independent clean-room implementation. Do not copy Remotion source into this repository.

## Testing

See [`.doc/08-testing-strategy.md`](.doc/08-testing-strategy.md) for the full strategy, fixture catalogue, and accuracy contract.

| Command | What it runs |
|---------|----------------|
| `yarn test` | Unit + component + golden stills |
| `yarn test:unit` | Package unit/component tests only |
| `yarn test:integration` | Golden still pixel diffs |
| `yarn test:render` | Short fixture MP4s + ffprobe |
| `yarn test:smoke` | Full `hello-explainer` dual-format render |
| `yarn test:update-goldens` | Regenerate `examples/*/expected/still-frame-*.png` |
| `yarn test:coverage` | Unit coverage report |

After intentional visual changes, run `yarn test:update-goldens`, inspect the PNGs under `examples/*/expected/`, then commit them with the code change.

`examples/motion-lab` is included: sampled stills must match committed goldens, and a determinism test re-renders the same frames twice and pixel-compares them.

Focused fixtures live under `examples/` (`solid-frames`, `fade-overlap`, `multi-format`, `audio-mix`, `motion-basics`, `motion-lab`) plus `hello-explainer`. Synthetic audio for `audio-mix` can be regenerated with `yarn generate:fixture-audio`.
