# Many Tracks

Thirty stacked tracks with one clip each. Use this fixture to exercise timeline vertical scrolling, track labels, reorder handles, and dock resize in the preview studio.

Catalogue: [examples/README.md](../README.md).

## Tracks

| Track | Layout |
|-------|--------|
| Track 01–30 | One 60-frame full-frame colour strip per track (hue steps around the wheel) |

Composition length is 60 frames. Track 30 paints on top in the preview.

## Commands

```bash
pnpm first-take validate examples/many-tracks/video.json
pnpm first-take preview examples/many-tracks/video.json
pnpm first-take render examples/many-tracks/video.json --format=16x9 --silent
```

## Timeline testing

1. Open preview and shrink the dock height, or leave the default height — 30 lanes exceed the default three-lane budget.
2. Scroll vertically over the timeline (unmodified wheel) to move through tracks.
3. Use Cmd+scroll (Ctrl+scroll on Windows) to zoom the time ruler without scrolling lanes.
