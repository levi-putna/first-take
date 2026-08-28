<p align="center">
  <img src="./img/logo-icon.svg" alt="First Take" width="128" height="128">
</p>

<h1 align="center">First Take</h1>

<p align="center"><strong>AI-first video editor.</strong> Bring your own agents.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/first-take"><img src="https://img.shields.io/npm/v/first-take" alt="npm"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/first-take" alt="node"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/levi-putna/first-take" alt="licence"></a>
</p>

First Take is **not an AI**. It does not generate footage, write your script, or pick a model for you. It is the toolchain that makes video editable with the agents you already use: Cursor, Claude Code, Codex, Copilot, or anything else that can edit files and run a CLI.

You give a brief. Your agent writes React scenes and a JSON timeline. You review stills and the preview studio, then ask for another pass. The output is an MP4 you can actually revise, because every shot is code and every cut is data.

```bash
npx first-take --help
```

## Bring your own agents

Generative video gives you a clip. First Take gives you a project: scene components, a declarative `video.json` timeline, and a closed CLI loop (`validate` → `still` → `preview` → `render`). Continuity comes from **shared components and props**, not from hoping a model keeps the same desk in every shot. Motion is a function of the current frame, so the same files always produce the same pixels.

Point your agent at [`AGENT-README.md`](./AGENT-README.md) before it scaffolds a project, writes a scene, or edits `video.json`. That file is the contract: component rules, timeline ownership, motion APIs, and which example to copy.

| What your agent gets | Why it matters |
|----------------------|----------------|
| Declarative `video.json` | Order, duration, tracks, formats, and props are data. Agents edit JSON instead of a hidden edit decision list. |
| Pure React scenes | Each scene is a default-exported component with JSON-serialisable props. Motion is `f(frame, props)`. |
| Deterministic pixels | The same files always produce the same frames, so iterate-and-diff actually works. |
| A closed CLI loop | `create` → write → `validate` → `still` → `preview` → `render`. Broken motion shows up in stills before you wait on an encode. |
| Copyable examples | Motion patterns, overlays, clips, audio mix, dual format, Three.js / WebGL. Start from the closest example; do not invent from scratch. |

A video is three layers. Do not mix them.

| Layer | Owns | Lives in |
|-------|------|----------|
| **Video** | Order, timing, formats, tracks | `video.json` |
| **Scene** | One clip: duration, gap, props | `tracks[].scenes[]` |
| **Component** | Frame-driven pixels from props | A default-exported `.tsx` file |

You stay the director. Revisions are code edits, not "regenerate and hope".

### Produce a full explainer

For brief → script → scenes → narration sync → render → critic, use the [`video-generate-explainer`](.claude/skills/video-generate-explainer/SKILL.md) skill with your own agent. Instructional design (what to teach, beat structure) is [`designing-training-videos`](.claude/skills/designing-training-videos/SKILL.md).

Typical loop once a project exists:

```bash
npx first-take validate video.json
npx first-take still video.json --frame=0 --out=out/still.png
npx first-take preview video.json
npx first-take render video.json --format=16x9
```

## Requirements

You need **Node.js 22+**. FFmpeg and ffprobe ship with the renderer. Override with `--ffmpeg-path` / `--ffprobe-path`, or `STORYBOARD_FFMPEG` / `STORYBOARD_FFPROBE`, if you want a system binary.

## Install

Run the CLI with **npx**. No install required:

```bash
npx first-take create my-feature
npx first-take render video.json
```

To pin it in a project:

```bash
pnpm add -D first-take
npx first-take render video.json
```

Scene files import the library packages: `@levi-putna/storyboard-core`, `@levi-putna/storyboard-media`, `@levi-putna/storyboard-transitions`, and `@levi-putna/storyboard-schema`.

## Quick start

If an agent is doing this, read [`AGENT-README.md`](./AGENT-README.md) first, then run the loop below.

```bash
npx first-take create my-feature
cd my-feature
pnpm install

npx first-take validate video.json
npx first-take preview video.json
npx first-take render video.json
```

`create` writes `video.json` (`schemaVersion` 3, `tracks[]`), two scene components on overlapping visual tracks, `package.json`, and `assets/audio/`. Pass `--with-audio` for a looping bed track with in-scene `<Audio>`; `--force` overwrites a non-empty folder.

Rendered files land in `out/` (for example `out/my-feature-16x9.mp4`). Use `--format=16x9` and `--out=out/hello.mp4` to pin a single format and path.

Then:

1. Edit scenes under `src/scenes/`.
2. Adjust tracks, formats, and props in `video.json`. Spec: [`.doc/06-video-json-schema.md`](.doc/06-video-json-schema.md).
3. Optional: drop MP3s into `assets/audio/` and play them with `<Audio>` inside a scene.

Drive all motion from `useCurrentFrame()`. Do not use CSS transitions or animations. Scenes are pure React components with props; `video.json` owns the timeline.

Authoring detail: [`.doc/07-authoring-guide.md`](.doc/07-authoring-guide.md).  
Component contract: [`.doc/10-component-requirements.md`](.doc/10-component-requirements.md).  
Real footage (trim, PIP, overlays): [`.doc/09-video-clips.md`](.doc/09-video-clips.md).  
Three.js / WebGL (frame-seeked mixer, not a wall-clock loop): [`examples/three-robot`](https://github.com/levi-putna/first-take/tree/main/examples/three-robot).

## Preview

`preview` opens a local studio in the browser. It plays the same React scenes and `video.json` timeline as render, so the stage matches the MP4. Scrub, trim, and tweak props here; the files stay the source of truth for the next agent pass.

![First Take preview studio showing the track-overlay example: composition stage, scene sidebar, and multi-lane timeline](./img/preview-studio.png)

The screenshot is [`track-overlay`](https://github.com/levi-putna/first-take/tree/main/examples/track-overlay): a full-length background, two lower thirds with a gap between them, and a corner badge on its own track.

The studio is split into three panes:

- **Sidebar** — scenes grouped by track, plus a props inspector for the selection
- **Stage** — the composition at the current format (switch, add, or remove a format from the toolbar; at least one format must remain)
- **Timeline** — play / pause, mute, timecode, and one lane per track

While authoring:

- Play and scrub the playhead. Mute lives in the dock. Preview audio is audible but not sample-accurate.
- Double-click a clip to isolate that scene on a local clock. Other tracks unmount, including their audio. Back restores the full video.
- Drag clips to reposition or trim their end; drop onto another track. Add tracks, edit track title and description, and reorder render order from the sidebar.
- **Undo** and **Redo** (buttons on the timeline header, or ⌘Z / ⌘⇧Z / Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) step through unsaved timeline and prop edits.
- Sidebar prop edits are live overrides. **Save to video.json** (or ⌘S / Ctrl+S) writes props and timeline edits to the open file so `render` / `still` pick them up.

```bash
npx first-take preview video.json
npx first-take preview video.json --port=3333 --no-open
```

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
npx first-take render video.json --format=16x9 --out=out/hello.mp4
npx first-take still video.json --frame=0 --out=out/still.png
npx first-take render video.json --verbose
```

## Packages

| Package | Role |
|---------|------|
| [`first-take`](https://www.npmjs.com/package/first-take) | `first-take` CLI |
| [`@levi-putna/storyboard-schema`](https://www.npmjs.com/package/@levi-putna/storyboard-schema) | `video.json` Zod schema and duration helpers |
| [`@levi-putna/storyboard-core`](https://www.npmjs.com/package/@levi-putna/storyboard-core) | Frame context, Sequence, interpolate, spring, composition |
| [`@levi-putna/storyboard-media`](https://www.npmjs.com/package/@levi-putna/storyboard-media) | Img, Audio, staticFile |
| [`@levi-putna/storyboard-transitions`](https://www.npmjs.com/package/@levi-putna/storyboard-transitions) | Fade TransitionSeries |
| [`@levi-putna/storyboard-renderer`](https://www.npmjs.com/package/@levi-putna/storyboard-renderer) | Vite bundle, Playwright capture, FFmpeg encode |
| [`@levi-putna/storyboard-preview`](https://www.npmjs.com/package/@levi-putna/storyboard-preview) | Studio: multi-lane timeline and audible preview |

## Develop

This repository is a pnpm workspaces monorepo. Clone it when you want to change the engine, not when you only want to make a video.

```bash
git clone https://github.com/levi-putna/first-take.git
cd first-take
pnpm install
pnpm build
```

### Examples

Compositions in [`examples/`](https://github.com/levi-putna/first-take/tree/main/examples) are workspaces. Each example README embeds a playable `preview.mp4` (16:9, plus 9:16 where the composition has both). After install and build, preview or render any of them:

```bash
npx first-take validate examples/hello-explainer/video.json
npx first-take preview examples/hello-explainer/video.json
npx first-take still examples/hello-explainer/video.json --frame=0 --out=out/still.png
npx first-take render examples/hello-explainer/video.json
```

`npx first-take create <slug>` from the repo root writes into `examples/<slug>/`. After scaffolding, run `pnpm install` so the new workspace is linked, then validate, preview, and render as above.

| Example | What it does |
|---------|----------------|
| [`hello-explainer`](https://github.com/levi-putna/first-take/tree/main/examples/hello-explainer) | Dual-format explainer: visual track + spanning mix (jingle, bed, narration) |
| [`track-overlay`](https://github.com/levi-putna/first-take/tree/main/examples/track-overlay) | Long background, gapped transparent overlays, corner badge for z-order |
| [`many-tracks`](https://github.com/levi-putna/first-take/tree/main/examples/many-tracks) | Thirty stacked tracks for timeline scroll and multi-lane UI testing |
| [`first-take-kit`](https://github.com/levi-putna/first-take/tree/main/examples/first-take-kit) | `TitleCard` scene used by the First Take macOS editor |
| [`motion-basics`](https://github.com/levi-putna/first-take/tree/main/examples/motion-basics) | Frame-driven `interpolate` and `spring` on a simple block |
| [`motion-lab`](https://github.com/levi-putna/first-take/tree/main/examples/motion-lab) | Catalogue of patterns (typewriter, float, pulse, slide, stagger, spring, progress, rotate) plus a frame timeline |
| [`solid-frames`](https://github.com/levi-putna/first-take/tree/main/examples/solid-frames) | Solid colour hold (deterministic paint fixture) |
| [`fade-overlap`](https://github.com/levi-putna/first-take/tree/main/examples/fade-overlap) | Two tracks with a 10-frame in-scene crossfade (50 frames total) |
| [`circle-wipe`](https://github.com/levi-putna/first-take/tree/main/examples/circle-wipe) | Iris wipe on a higher track between two colour holds |
| [`multi-format`](https://github.com/levi-putna/first-take/tree/main/examples/multi-format) | Same composition rendered in 16:9 and 9:16 |
| [`audio-mix`](https://github.com/levi-putna/first-take/tree/main/examples/audio-mix) | Visual track plus in-scene jingle / looping bed / narration |
| [`audio-volume-fade`](https://github.com/levi-putna/first-take/tree/main/examples/audio-volume-fade) | Looped bed with a V-shaped volume envelope (fade out, then back in) |
| [`clip-trim-fullscreen`](https://github.com/levi-putna/first-take/tree/main/examples/clip-trim-fullscreen) | Full-screen clip trimmed with `startFrom` / `endAt` |
| [`clip-pip-presenter`](https://github.com/levi-putna/first-take/tree/main/examples/clip-pip-presenter) | Presenter picture-in-picture in the corner over motion graphics |
| [`clip-overlay-shapes`](https://github.com/levi-putna/first-take/tree/main/examples/clip-overlay-shapes) | Full-screen clip with animated shapes on top |
| [`clip-zoom-presenter`](https://github.com/levi-putna/first-take/tree/main/examples/clip-zoom-presenter) | Ken Burns zoom in, hold, then zoom out on presenter footage |
| [`clip-hard-cut`](https://github.com/levi-putna/first-take/tree/main/examples/clip-hard-cut) | Two clips back-to-back with no transition |
| [`clip-sound-move`](https://github.com/levi-putna/first-take/tree/main/examples/clip-sound-move) | Sound-on clip that drifts around the frame |
| [`timeline-alignment`](https://github.com/levi-putna/first-take/tree/main/examples/timeline-alignment) | 5-minute fixture: colour holds every 10s plus a per-second counter overlay |
| [`three-robot`](https://github.com/levi-putna/first-take/tree/main/examples/three-robot) | Three.js / WebGL: RobotExpressive walk, seeked from `useCurrentFrame()`; camera pull-out in the second half |

### Tests

Full strategy, fixture catalogue, and accuracy contract: [`.doc/08-testing-strategy.md`](.doc/08-testing-strategy.md).

| Command | What it runs |
|---------|----------------|
| `pnpm test` | Unit + component + golden stills |
| `pnpm test:unit` | Package unit and component tests |
| `pnpm test:integration` | Golden still pixel diffs |
| `pnpm test:render` | Short fixture MP4s + ffprobe |
| `pnpm test:smoke` | Full `hello-explainer` dual-format render |
| `pnpm test:update-goldens` | Regenerate `examples/*/expected/still-frame-*.png` |
| `pnpm test:coverage` | Unit coverage report |

After intentional visual changes, run `pnpm test:update-goldens`, inspect the PNGs under `examples/*/expected/`, and commit them with the code.

Golden stills and render fixtures live under [`examples/`](https://github.com/levi-putna/first-take/tree/main/examples). `motion-lab` also re-renders sampled frames twice and pixel-compares them for determinism. Regenerate synthetic audio for `audio-mix` with `pnpm generate:fixture-audio`.

### Documentation

Architecture, requirements, and the timing model live in [`.doc/`](.doc/). Playable examples: [`examples/README.md`](https://github.com/levi-putna/first-take/tree/main/examples). Agent playbook: [`AGENT-README.md`](./AGENT-README.md). Explainer production skill: [`.claude/skills/video-generate-explainer/SKILL.md`](.claude/skills/video-generate-explainer/SKILL.md). Changelog: [`CHANGELOG.md`](CHANGELOG.md).

Issues and pull requests: [github.com/levi-putna/first-take](https://github.com/levi-putna/first-take).

## Licence

[MIT](./LICENSE). Independent clean-room implementation. Do not copy Remotion source into this repository.

## About

First Take is an open-source, AI-first video editor: React scenes, a JSON timeline, a preview studio, and a CLI. Use it with whatever agents you already run. Install today with `npx first-take`.

There is also a macOS First Take editor that speaks the same scene files and `video.json` timeline.

Built by [Levi Putna](https://www.twistedbrackets.com). More writing, tools, and agent skills at [Twisted Brackets](https://www.twistedbrackets.com).
