# Clip Trim Fullscreen

A long source clip trimmed inside `<Video>` (`startFrom` / `endAt`) while the scene duration is shorter than the file. The rest of the source is never shown.

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 600-frame trimmed fullscreen clip |

## Commands

```bash
yarn storyboard validate examples/clip-trim-fullscreen/video.json
yarn storyboard preview examples/clip-trim-fullscreen/video.json
yarn storyboard render examples/clip-trim-fullscreen/video.json --format=16x9 --silent
```
