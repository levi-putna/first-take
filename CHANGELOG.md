# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Preview studio: **Save to video.json** writes live prop inspector overrides
  back to the open manifest (⌘S / Ctrl+S).
- Preview studio: drag clips to reposition or trim, move between tracks, and
  manage track title, description, and render order; timeline edits save to
  `video.json`.
- Track `description` field and empty `scenes` arrays (at least one track must
  still contain a scene).

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
