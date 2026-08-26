# Storyboard

Frame-deterministic React video engine. You write scenes as React components, describe the timeline in `video.json`, and the CLI renders an MP4.

[![npm](https://img.shields.io/npm/v/@levi-putna/storyboard)](https://www.npmjs.com/package/@levi-putna/storyboard)
[![node](https://img.shields.io/node/v/@levi-putna/storyboard)](https://nodejs.org)
[![license](https://img.shields.io/github/license/levi-putna/storyboard)](./LICENSE)

```bash
npx @levi-putna/storyboard --help
```

Motion is a function of the current frame. Same inputs always produce the same pixels, so renders stay reproducible.

**Agents:** read [`AGENT-README.md`](./AGENT-README.md) before scaffolding a video, writing scene components, or editing `video.json`. It covers the component contract, timeline ownership, motion APIs, and which example to copy.

## Requirements

You need **Node.js 22+**. FFmpeg and ffprobe ship with the renderer. Override with `--ffmpeg-path` / `--ffprobe-path`, or `STORYBOARD_FFMPEG` / `STORYBOARD_FFPROBE`, if you want a system binary.

## Install

Run the CLI with **npx**. No install required:

```bash
npx @levi-putna/storyboard create my-feature
npx @levi-putna/storyboard render video.json
```

To pin it in a project:

```bash
pnpm add -D @levi-putna/storyboard
npx storyboard render video.json
```

Scene files import the library packages: `@levi-putna/storyboard-core`, `@levi-putna/storyboard-media`, `@levi-putna/storyboard-transitions`, and `@levi-putna/storyboard-schema`.

## Quick start

```bash
npx @levi-putna/storyboard create my-feature
cd my-feature
pnpm install

npx @levi-putna/storyboard validate video.json
npx @levi-putna/storyboard preview video.json
npx @levi-putna/storyboard render video.json
```

`create` writes `video.json`, a lead-in plus two scene components, `playground.ts`, `package.json`, and `assets/audio/`. Pass `--with-audio` if you already have jingle, bed, or narration files; `--force` overwrites a non-empty folder.

Rendered files land in `out/` (for example `out/my-feature-16x9.mp4`). Use `--format=16x9` and `--out=out/hello.mp4` to pin a single format and path.

Then:

1. Edit scenes under `src/scenes/` and the bumper in `src/components/LeadIn.tsx`.
2. Adjust timeline, formats, and props in `video.json`. Spec: [`.doc/06-video-json-schema.md`](.doc/06-video-json-schema.md).
3. Optional: drop MP3s into `assets/audio/` and enable `seriesAudio`.

Drive all motion from `useCurrentFrame()`. Do not use CSS transitions or animations. Scenes are pure React components with props; `video.json` owns the timeline and audio. Changing playground props restarts the animation from frame 0. That is intentional.

Agent playbook: [`AGENT-README.md`](./AGENT-README.md).  
Authoring detail: [`.doc/07-authoring-guide.md`](.doc/07-authoring-guide.md).  
Component contract: [`.doc/10-component-requirements.md`](.doc/10-component-requirements.md).  
Real footage (trim, PIP, overlays): [`.doc/09-video-clips.md`](.doc/09-video-clips.md).

## CLI

| Command | Purpose |
|---------|---------|
| `create <slug>` | Scaffold a project. `--dir`, `--title`, `--with-audio`, `--force` |
| `validate <video.json>` | Check the manifest and assets. `--no-assets` skips file existence |
| `preview <video.json>` | Studio in the browser. `--port`, `--no-open` |
| `still <video.json> --frame=N` | Capture one PNG. `--format`, `--out` |
| `render <video.json>` | Encode MP4(s). `--format=16x9\|all`, `--out`, `--concurrency`, `--keep-frames` |

`--silent` and `--no-audio` mute audio in the encode. They do not quiet logs.

Global `--verbose` prints FFmpeg output and phase detail. Without it, the CLI prints progress and errors only.

```bash
npx @levi-putna/storyboard render video.json --format=16x9 --out=out/hello.mp4
npx @levi-putna/storyboard still video.json --frame=0 --out=out/still.png
npx @levi-putna/storyboard render video.json --verbose
```

## Packages

| Package | Role |
|---------|------|
| [`@levi-putna/storyboard`](https://www.npmjs.com/package/@levi-putna/storyboard) | `storyboard` CLI |
| [`@levi-putna/storyboard-schema`](https://www.npmjs.com/package/@levi-putna/storyboard-schema) | `video.json` Zod schema and duration helpers |
| [`@levi-putna/storyboard-core`](https://www.npmjs.com/package/@levi-putna/storyboard-core) | Frame context, Sequence, interpolate, spring, composition |
| [`@levi-putna/storyboard-media`](https://www.npmjs.com/package/@levi-putna/storyboard-media) | Img, Audio, staticFile |
| [`@levi-putna/storyboard-transitions`](https://www.npmjs.com/package/@levi-putna/storyboard-transitions) | Fade TransitionSeries |
| [`@levi-putna/storyboard-renderer`](https://www.npmjs.com/package/@levi-putna/storyboard-renderer) | Vite bundle, Playwright capture, FFmpeg encode |
| [`@levi-putna/storyboard-preview`](https://www.npmjs.com/package/@levi-putna/storyboard-preview) | Studio and component playground |

## Develop

This repository is a Yarn 1.x workspaces monorepo. Clone it when you want to change the engine, not when you only want to make a video.

```bash
git clone https://github.com/levi-putna/storyboard.git
cd storyboard
yarn install
yarn build
```

### Examples

Compositions in [`examples/`](./examples/) are workspaces. After install and build, preview or render any of them:

```bash
npx @levi-putna/storyboard validate examples/hello-explainer/video.json
npx @levi-putna/storyboard preview examples/hello-explainer/video.json
npx @levi-putna/storyboard still examples/hello-explainer/video.json --frame=0 --out=out/still.png
npx @levi-putna/storyboard render examples/hello-explainer/video.json
```

`npx @levi-putna/storyboard create <slug>` from the repo root writes into `examples/<slug>/`. After scaffolding, run `yarn install` so the new workspace is linked, then validate, preview, and render as above.

| Example | What it does |
|---------|----------------|
| [`hello-explainer`](./examples/hello-explainer/) | Full dual-format explainer: lead-in, two scenes, fade, series audio (jingle, bed, narration) |
| [`first-take-kit`](./examples/first-take-kit/) | `TitleCard` scene used by the First Take macOS editor |
| [`motion-basics`](./examples/motion-basics/) | Frame-driven `interpolate` and `spring` on a simple block |
| [`motion-lab`](./examples/motion-lab/) | Catalogue of patterns (typewriter, float, pulse, slide, stagger, spring, progress, rotate) plus a frame timeline |
| [`solid-frames`](./examples/solid-frames/) | Solid colour that steps every 15 frames (deterministic paint fixture) |
| [`fade-overlap`](./examples/fade-overlap/) | Two scenes with a 10-frame fade; total duration is sum minus overlap |
| [`multi-format`](./examples/multi-format/) | Same composition rendered in 16:9 and 9:16 |
| [`audio-mix`](./examples/audio-mix/) | Series audio: jingle, looping bed, narration, lead-in and tail |
| [`audio-volume-fade`](./examples/audio-volume-fade/) | Looped bed with a V-shaped volume envelope (fade out, then back in) |
| [`clip-trim-fullscreen`](./examples/clip-trim-fullscreen/) | Full-screen clip trimmed with `startFrom` / `endAt` |
| [`clip-pip-presenter`](./examples/clip-pip-presenter/) | Presenter picture-in-picture in the corner over motion graphics |
| [`clip-overlay-shapes`](./examples/clip-overlay-shapes/) | Full-screen clip with animated shapes on top |
| [`clip-zoom-presenter`](./examples/clip-zoom-presenter/) | Ken Burns zoom in, hold, then zoom out on presenter footage |
| [`clip-hard-cut`](./examples/clip-hard-cut/) | Two clips back-to-back with no transition |
| [`clip-sound-move`](./examples/clip-sound-move/) | Sound-on clip that drifts around the frame |

### Tests

Full strategy, fixture catalogue, and accuracy contract: [`.doc/08-testing-strategy.md`](.doc/08-testing-strategy.md).

| Command | What it runs |
|---------|----------------|
| `yarn test` | Unit + component + golden stills |
| `yarn test:unit` | Package unit and component tests |
| `yarn test:integration` | Golden still pixel diffs |
| `yarn test:render` | Short fixture MP4s + ffprobe |
| `yarn test:smoke` | Full `hello-explainer` dual-format render |
| `yarn test:update-goldens` | Regenerate `examples/*/expected/still-frame-*.png` |
| `yarn test:coverage` | Unit coverage report |

After intentional visual changes, run `yarn test:update-goldens`, inspect the PNGs under `examples/*/expected/`, and commit them with the code.

Golden stills and render fixtures live under [`examples/`](./examples/). `motion-lab` also re-renders sampled frames twice and pixel-compares them for determinism. Regenerate synthetic audio for `audio-mix` with `yarn generate:fixture-audio`.

### Documentation

Architecture, requirements, and the timing model live in [`.doc/`](.doc/). Agent playbook for generating videos: [`AGENT-README.md`](./AGENT-README.md). Changelog: [`CHANGELOG.md`](CHANGELOG.md).

Issues and pull requests: [github.com/levi-putna/storyboard](https://github.com/levi-putna/storyboard).

## Licence

[MIT](./LICENSE). Independent clean-room implementation. Do not copy Remotion source into this repository.

## About

Built by [Levi Putna](https://www.twistedbrackets.com). More writing, tools, and agent skills at [Twisted Brackets](https://www.twistedbrackets.com).
