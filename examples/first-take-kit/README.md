# First Take scene kit

Mirror of the React scenes First Take writes under each session’s `storyboard/scenes/` folder via `StoryboardAdapter` / `StoryboardSceneKit`.

Primary templates live in the First Take app (`Sources/FirstTake/Editor/StoryboardBridge/StoryboardAdapter.swift`) so the macOS editor can emit them without a pnpm workspace link. This example is for First Take preview/render smoke of `TitleCard`.

The manifest uses `schemaVersion` 3 `tracks[]` — a breaking change for the adapter. Scene ids must stay unique across tracks.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | TitleCard (90f) |

## Commands

```bash
pnpm first-take validate examples/first-take-kit/video.json
pnpm first-take preview examples/first-take-kit/video.json
pnpm first-take render examples/first-take-kit/video.json --format=16x9 --silent
```
