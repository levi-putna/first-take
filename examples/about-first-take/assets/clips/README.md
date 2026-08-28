# Live clips

Labelled placeholders. Replace in place, keep the filenames, or update `src` in `video.json`.

| File | Role | Record |
|------|------|--------|
| `presenter.mp4` | Talking-head PIP | You on camera, ~32s+. Muted in the composition. |
| `screen.mp4` | Preview studio | 1920×1080 capture of scrub / isolate / props / save / drag / undo. |
| `cursor-keys.mp4` | Mouse + keyboard | Same actions, on **black** (mix-blend screen drops black out). |

All three tracks share the studio beat: they start at frame 1950 and last 960 frames (~32s). Trim with `startFrom` (seconds in the source file) if the useful action does not start at 0:00.
