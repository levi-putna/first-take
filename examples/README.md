# Examples

Each folder is a workspace with `video.json`, scene components, and a committed preview you can play from that example’s README (`preview.mp4`, plus `preview-9x16.mp4` when the composition has both formats). [`timeline-alignment`](./timeline-alignment/README.md) is a 5-minute fixture, so its README embeds a still; play the full cut in the studio.

Open an example README to watch the render, then preview or re-render locally:

```bash
pnpm first-take preview examples/<slug>/video.json
pnpm first-take render examples/<slug>/video.json --format=16x9
```

| Example | What it does |
|---------|----------------|
| [hello-explainer](./hello-explainer/README.md) | Dual-format explainer: visual track + spanning mix (jingle, bed, narration) |
| [track-overlay](./track-overlay/README.md) | Long background, gapped transparent overlays, corner badge for z-order |
| [many-tracks](./many-tracks/README.md) | Thirty stacked tracks for timeline scroll and multi-lane UI testing |
| [first-take-kit](./first-take-kit/README.md) | `TitleCard` scene used by the First Take macOS editor |
| [motion-basics](./motion-basics/README.md) | Frame-driven `interpolate` and `spring` on a simple block |
| [motion-lab](./motion-lab/README.md) | Catalogue of patterns (typewriter, float, pulse, slide, stagger, spring, progress, rotate) plus a frame timeline |
| [solid-frames](./solid-frames/README.md) | Solid colour hold (deterministic paint fixture) |
| [fade-overlap](./fade-overlap/README.md) | Two tracks with a 10-frame in-scene crossfade; total duration 50 frames |
| [circle-wipe](./circle-wipe/README.md) | Iris wipe on a higher track between two colour holds |
| [multi-format](./multi-format/README.md) | Same composition rendered in 16:9 and 9:16 |
| [audio-mix](./audio-mix/README.md) | Visual track plus in-scene jingle / looping bed / narration |
| [audio-volume-fade](./audio-volume-fade/README.md) | Looped bed with a V-shaped volume envelope (fade out, then back in) |
| [clip-trim-fullscreen](./clip-trim-fullscreen/README.md) | Full-screen clip trimmed with `startFrom` / `endAt` |
| [clip-pip-presenter](./clip-pip-presenter/README.md) | Presenter picture-in-picture in the corner over motion graphics |
| [clip-overlay-shapes](./clip-overlay-shapes/README.md) | Full-screen clip with animated shapes on top |
| [clip-zoom-presenter](./clip-zoom-presenter/README.md) | Ken Burns zoom in, hold, then zoom out on presenter footage |
| [clip-hard-cut](./clip-hard-cut/README.md) | Two clips back-to-back with no transition |
| [clip-sound-move](./clip-sound-move/README.md) | Sound-on clip that drifts around the frame |
| [timeline-alignment](./timeline-alignment/README.md) | 5-minute fixture: colour holds every 10s plus a per-second counter overlay |
| [three-robot](./three-robot/README.md) | Frame-seeked Three.js clip: RobotExpressive walks; camera pulls out in the second half |

Studio UI: [Preview](../README.md#preview) in the root README.
