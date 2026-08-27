# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-08-27

### Added

- `three-robot` example: an 11-second frame-seeked Three.js walk (RobotExpressive), with a camera pull-out in the second half.
- Headless Chromium launches with `--use-gl=angle` so WebGL compositions can capture.
- Preview serves `.glb` / `.gltf` with the glTF MIME types.
- Preview studio: **Save to video.json** writes live prop inspector overrides
  back to the open manifest (⌘S / Ctrl+S).
- Preview studio: undo and redo for unsaved timeline and prop edits (timeline
  header buttons; ⌘Z / ⌘⇧Z / Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y).
- Preview studio: drag clips to reposition or trim, move between tracks, and
  manage track title, description, and render order; timeline edits save to
  `video.json`.
- Preview studio: delete a format from the toolbar (at least one format must remain).
- Track `description` field and empty `scenes` arrays (at least one track must
  still contain a scene).
- `many-tracks` example: thirty stacked lanes for timeline scroll and multi-lane UI testing.
- `circle-wipe` iris can hold fully closed for `pauseMs` before opening.
- `@levi-putna/storyboard` now publishes the project README on npm.

### Changed

- Breaking: `video.json` is `schemaVersion` 3. Scene `transitionIn` is gone —
  use overlapping tracks and in-scene motion for fades and wipes.
- Preview timeline ruler uses scale-aware decimal precision (up to three
  places, e.g. `0.025`) so zoomed-in ticks stay unique instead of collapsing
  to the same hundredths label. Zoom-in now reaches a 0.25s window so
  millisecond-scale times can appear when the tick spacing allows.

## [0.2.0] - 2026-08-26

### Added

- Stacked `tracks[]` in `video.json` (`schemaVersion` 2), `gapBeforeFrames`,
  multi-lane preview, in-scene `<Audio>` (including audible studio playback),
  and the `track-overlay` example.
- `timeline-alignment` example (5-minute playhead / clip-alignment fixture).
- Bundled ffmpeg and ffprobe with the renderer. Override with `--ffmpeg-path` /
  `--ffprobe-path`, or `STORYBOARD_FFMPEG` / `STORYBOARD_FFPROBE`.
- Preview studio: format switcher, project explorer, double-click clip
  isolation, timeline zoom / focus bar, and committed example previews.
- Agent-oriented README and [`AGENT-README.md`](./AGENT-README.md) playbook.

### Changed

- Breaking: root `scenes[]`, `leadIn`, and `seriesAudio` are gone. Put bumpers
  on a visual track and mix with `<Audio>` inside scenes. Isolation is
  double-click on the timeline, not a Playground tab / `playground.ts`.

## [0.1.0] - 2026-08-26

### Added

- Public npm packages under `@levi-putna/storyboard*` so the CLI can be run
  with `npx @levi-putna/storyboard`.
