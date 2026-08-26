# Real video clips (v1)

Storyboard embeds real footage with a Remotion-style **offthread** path so every composition frame is deterministic.

## How Remotion does it

- Preview: HTML `<video>` seeked to the timeline time (convenient, not always frame-exact).
- Render: **`OffthreadVideo`** asks FFmpeg (outside the browser) for the exact source frame and shows it as an `<img>`. That avoids Chromium seek drift during concurrent screenshot capture.
- Trim props (`startFrom` / `endAt`, now `trimBefore` / `trimAfter`) select a window in the *source* file; composition duration is authored separately.

## How Storyboard mirrors that

1. `<Video src startFrom endAt />` registers the clip and computes media time from `useCurrentFrame()`.
2. During `renderMedia`, Playwright mounts the composition, collects video descriptors, then **pre-extracts** a JPEG sequence for the trim window at composition `fps` (`packages/renderer/src/video-frames.ts`).
3. The page receives `__STORYBOARD_VIDEO_FRAMES__`; `<Video>` switches to `<img>` stills for capture.
4. Source audio is muxed via the existing Audio registry with `mediaStartSeconds` / `mediaEndSeconds` → FFmpeg `atrim`.

Positioning is plain CSS: full-bleed `AbsoluteFill`, or a sized/positioned wrapper for PIP.

## Examples

| Project | Demonstrates |
|---------|----------------|
| `examples/clip-trim-fullscreen` | Full-screen clip, `startFrom={10}` `endAt={30}` (20s) |
| `examples/clip-pip-presenter` | Presenter PIP bottom-left + animated graphics |
| `examples/clip-overlay-shapes` | Full-screen clip with shapes animated on top |

Assets live under each example's `assets/clips/`.
