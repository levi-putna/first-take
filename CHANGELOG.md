# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Public npm packages under `@levi-putna/storyboard*` so the CLI can be run
  with `npx @levi-putna/storyboard`.
- Stacked `tracks[]` in `video.json` (`schemaVersion` 2), `gapBeforeFrames`,
  multi-lane preview, in-scene `<Audio>` (including audible studio playback),
  and the `track-overlay` example.

### Changed

- Breaking: root `scenes[]`, `leadIn`, and `seriesAudio` are gone. Put bumpers
  on a visual track and mix with `<Audio>` inside scenes. Isolation is
  double-click on the timeline, not a Playground tab / `playground.ts`.
