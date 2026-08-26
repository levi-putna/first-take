# First Take scene kit

Mirror of the React scenes First Take writes under each session’s `storyboard/scenes/` folder via `StoryboardAdapter` / `StoryboardSceneKit`.

Primary templates live in the First Take app (`Sources/FirstTake/Editor/StoryboardBridge/StoryboardAdapter.swift`) so the macOS editor can emit them without a yarn link. This example is for Storyboard preview/render smoke of `TitleCard`.

The manifest uses `schemaVersion` 2 `tracks[]` — a breaking change for the adapter. Scene ids must stay unique across tracks.

## Tracks

| Track | Scenes |
|-------|--------|
| Main | TitleCard (90f) |

## Commands

```bash
yarn storyboard validate examples/first-take-kit/video.json
yarn storyboard preview examples/first-take-kit/video.json
yarn storyboard render examples/first-take-kit/video.json --format=16x9 --silent
```
