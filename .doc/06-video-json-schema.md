# Video file specification (`video.json`)

Normative specification for the Storyboard **video definition file** — the JSON
manifest that drives validation, preview, still capture, and MP4 render.

Validated by `@storyboard/schema` (`videoManifestSchema`). Current
`schemaVersion` is **`1`**.

Companion docs:

| Doc | Role |
|-----|------|
| This file | Normative field and validation contract |
| [04-timing-and-audio.md](./04-timing-and-audio.md) | How narration alignment maps onto these fields |
| [07-authoring-guide.md](./07-authoring-guide.md) | Practical CLI / project layout |
| [10-component-requirements.md](./10-component-requirements.md) | Requirements for React modules referenced by this file |
| [09-video-clips.md](./09-video-clips.md) | Embedding real footage *inside* components |

---

## 1. Purpose and layer model

```
video.json  →  scenes + lead-in + formats + series audio
     │
     ├─ resolves React modules (paths relative to this file)
     ├─ resolves audio assets (paths relative to assetsRoot)
     └─ computes total composition duration in frames
```

| Layer | Owned by | Responsibility |
|-------|----------|----------------|
| **Video** | `video.json` | Order, timing, formats, global audio, which modules to load |
| **Scene** | One entry in `scenes[]` | One timeline beat: duration, props, optional narration window |
| **Component** | `.tsx` module | Frame-driven pixels from props (see component requirements) |

The JSON file is the single source of timeline truth. Components must not
hardcode global scene order or composition length.

---

## 2. File identity

| Property | Value |
|----------|--------|
| Typical filename | `video.json` (any path accepted by the CLI) |
| Encoding | UTF-8 JSON object |
| Schema | `schemaVersion: 1` |
| Validate | `yarn storyboard validate <path-to-video.json>` |

Invalid JSON, schema failures, illegal transitions, unsupported `visualType`,
or missing referenced audio files cause validation to fail.

---

## 3. Root object

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `schemaVersion` | `1` (literal) | yes | — | Bump only on breaking manifest changes |
| `slug` | non-empty string | yes | — | Output filename stem (e.g. `hello-explainer` → `hello-explainer-16x9.mp4`) |
| `title` | non-empty string | yes | — | Human-readable title |
| `fps` | positive number | no | `30` | Frames per second for the whole composition |
| `formats` | `Format[]` | yes (≥1) | — | One render pass per format unless the CLI selects one |
| `assetsRoot` | string | no | `"."` | Base directory for series-audio paths; relative to the JSON file’s directory |
| `leadIn` | `LeadIn` | no | — | Visual bumper during series lead-in |
| `seriesAudio` | `SeriesAudio` | no | — | Jingle / bed / narration mix |
| `scenes` | `Scene[]` | yes (≥1) | — | Ordered timeline beats |

### 3.1 Format

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | non-empty string | yes | Stable id used in CLI `--format` and output names (e.g. `16x9`) |
| `aspectRatio` | non-empty string | yes | Descriptive label (e.g. `16:9`); not used for math |
| `width` | positive integer | yes | Render width in pixels |
| `height` | positive integer | yes | Render height in pixels |

All formats share the same timeline, fps, scenes, and audio. Only layout that
reads `useVideoConfig().width` / `.height` should differ per format.

### 3.2 LeadIn

Shown for `round(seriesAudio.leadInSeconds * fps)` frames at the start of the
composition (or zero lead-in frames if `seriesAudio` / `leadInSeconds` is absent).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `component` | non-empty string | no | Path to a default-export React module, relative to the JSON file |
| `props` | object | no | Arbitrary JSON props passed into the component |

If `leadIn` is omitted, the lead-in time (if any) may still exist for audio
while the picture is empty / clear depending on the renderer composition.

### 3.3 SeriesAudio

Optional overarching mix for explainer-style videos. Paths are resolved as:

```
<path of video.json directory> / <assetsRoot> / <relativePath>
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `leadInSeconds` | ≥ 0 number | `4` | Pre-roll before narration / content |
| `jingle` | string | — | Intro sting under `assetsRoot` |
| `bed` | string | — | Looping underscore |
| `narration` | string | — | Continuous body VO file |
| `jingleVolume` | 0–2 | `0.55` | Peak jingle gain |
| `bedVolumeUnderVo` | 0–2 | `0.12` | Bed level under narration |
| `bedVolumeLeadIn` | 0–2 | `0.08` | Bed level during lead-in |
| `jingleFadeOutSeconds` | ≥ 0 | `0.6` | Crossfade as VO starts |
| `bedFadeInSeconds` | ≥ 0 | `0.8` | |
| `bedFadeOutSeconds` | ≥ 0 | `1.2` | |
| `tailSeconds` | ≥ 0 | — | Extra hold after content (e.g. bed fade) |

Any of `jingle`, `bed`, or `narration` that is set **must** exist on disk when
asset checking is enabled (default for `validate`).

Volume fields accept up to `2` to allow intentional boost; typical values stay ≤ `1`.

---

## 4. Scene object

Each scene is one beat on the timeline.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | non-empty string | yes | — | Stable id (unique recommended) |
| `title` | non-empty string | yes | — | Human label |
| `visualType` | enum | no | `"component"` | MVP: only `"component"` is allowed |
| `component` | non-empty string | yes | — | Module path relative to the JSON file |
| `props` | object | no | — | Scene data passed to the component |
| `durationInFrames` | positive integer | yes | — | Local length of this scene |
| `audioStartSeconds` | ≥ 0 number | no | — | Start in the **narration file** clock |
| `audioEndSeconds` | ≥ 0 number | no | — | End in the **narration file** clock |
| `narration` | string | no | — | Script slice for this beat (documentation / tooling) |
| `transitionIn` | `null` \| `TransitionIn` | no | — | Overlap with the **previous** scene |

### 4.1 visualType

| Value | Status |
|-------|--------|
| `component` | Supported — load React module at `component` |
| `generated-video` | Reserved — rejected in MVP validation |
| `real-video` | Reserved — rejected in MVP validation |

Real footage is embedded **inside** a component via `@storyboard/media` `<Video />`,
not via `visualType: "real-video"`. See [09-video-clips.md](./09-video-clips.md).

### 4.2 transitionIn

| Field | Type | Notes |
|-------|------|-------|
| `type` | `"fade"` | Only fade is defined in schema v1 |
| `durationInFrames` | positive integer | Overlap length |

Rules (enforced by `validateTransitionLengths`):

1. The first scene’s `transitionIn` does not create an overlap (index 0).
2. For scene `i` (`i ≥ 1`), if `transitionIn.durationInFrames` is `t > 0`:
   - `t` must be **strictly less than** the previous scene’s `durationInFrames`
   - `t` must be **strictly less than** this scene’s `durationInFrames`
3. `null` or omitted means a hard cut (no overlap).

### 4.3 Component path resolution

```
resolve(dirname(video.json), scene.component)
```

`assetsRoot` does **not** apply to component paths. Example: with
`video.json` at `examples/hello-explainer/video.json` and
`"component": "src/scenes/01-Hook.tsx"`, the module is
`examples/hello-explainer/src/scenes/01-Hook.tsx`.

The module **must** default-export a React component. See
[10-component-requirements.md](./10-component-requirements.md).

### 4.4 Props

`props` is an arbitrary JSON object. Storyboard does not validate prop shapes.
The component is responsible for typing and defaults. Prefer serialisable values
(strings, numbers, booleans, plain objects/arrays). Do not put functions in JSON.

### 4.5 Narration timing fields

When series narration is used:

- `audioStartSeconds` / `audioEndSeconds` are relative to the **narration media
  file**, not the composition clock.
- Composition content starts after `leadInFrames` (see §5).
- Upstream tooling typically sets:

```
durationInFrames =
  round((audioEndSeconds - audioStartSeconds) * fps) + LEAD_OUT_FRAMES
```

with a small lead-out (about 3–5 frames) so cuts are not clipped. See
[04-timing-and-audio.md](./04-timing-and-audio.md).

---

## 5. Duration math

All integers are frames. `fps` comes from the root.

```
leadInFrames    = round((seriesAudio?.leadInSeconds ?? 0) * fps)
contentFrames   = sum(scene.durationInFrames)
                  - sum(transitionIn.durationInFrames for scenes after the first)
tailFrames      = round((seriesAudio?.tailSeconds ?? 0) * fps)
totalFrames     = leadInFrames + contentFrames + tailFrames
```

Scene absolute start frames (after lead-in, with overlaps):

```
cursor = leadInFrames
for each scene i:
  overlap = (i == 0) ? 0 : (scene.transitionIn?.durationInFrames ?? 0)
  cursor -= overlap
  sceneStarts[i] = cursor
  cursor += scene.durationInFrames
```

Implemented in `@storyboard/schema` as `leadInFrames`, `contentDurationInFrames`,
`totalDurationInFrames`, and `sceneStartFrames`.

---

## 6. Minimal and full examples

### Minimal (silent, single format)

```json
{
  "schemaVersion": 1,
  "slug": "solid-frames",
  "title": "Solid Frames",
  "fps": 30,
  "formats": [
    { "id": "16x9", "aspectRatio": "16:9", "width": 1920, "height": 1080 }
  ],
  "scenes": [
    {
      "id": "01",
      "title": "Colour hold",
      "visualType": "component",
      "component": "src/scenes/Colour.tsx",
      "props": { "colour": "#112233" },
      "durationInFrames": 30,
      "transitionIn": null
    }
  ]
}
```

### Full explainer-shaped (abridged)

See `examples/hello-explainer/video.json` for a complete dual-format file with
`leadIn`, `seriesAudio`, two scenes, and a mid-timeline fade.

---

## 7. Validation checklist

`yarn storyboard validate <video.json>` (via `validateVideoFile`) checks:

1. File exists and parses as JSON  
2. Zod schema (`videoManifestSchema`)  
3. Transition length rules (§4.2)  
4. Referenced series-audio files exist (unless `checkAssets: false`)  
5. Every scene `visualType` is `"component"`  

It does **not** currently type-check React props or execute components.

---

## 8. Project layout convention

Scaffolded by `yarn storyboard create <slug>`:

```
my-video/
  video.json              ← this specification
  playground.ts           ← optional preview registry
  package.json
  src/
    scenes/               ← scene entry components
    components/           ← shared / lead-in components
  assets/
    audio/                ← seriesAudio paths typically live here
```

This layout is conventional, not schema-enforced. Paths in JSON may point
anywhere relative to the manifest (or under `assetsRoot` for audio).

---

## 9. Compatibility

| Change | Guidance |
|--------|----------|
| Add optional root/scene fields | Prefer backward-compatible additions; keep `schemaVersion: 1` until a break |
| Rename/remove fields or change types | Bump `schemaVersion` and update this doc + `@storyboard/schema` |
| New transition types | Extend `transitionInSchema`; document here |
| Implement `generated-video` / `real-video` | Remove MVP rejection in `validate.ts` and document behaviour |

Schema source of truth in code: `packages/schema/src/manifest.ts`.
