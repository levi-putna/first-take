# Video file specification (`video.json`)

Normative specification for the First Take **video definition file** — the JSON
manifest that drives validation, preview, still capture, and MP4 render.

Validated by `@levi-putna/storyboard-schema` (`videoManifestSchema`). Current
`schemaVersion` is **`3`** (v2 removed framework `transitionIn`).

Companion docs:

| Doc | Role |
|-----|------|
| This file | Normative field and validation contract |
| [04-timing-and-audio.md](./04-timing-and-audio.md) | In-scene Audio, Sequence clipping, preview vs mux |
| [07-authoring-guide.md](./07-authoring-guide.md) | Practical CLI / project layout |
| [10-component-requirements.md](./10-component-requirements.md) | Requirements for React modules referenced by this file |
| [09-video-clips.md](./09-video-clips.md) | Embedding real footage *inside* components |

---

## 1. Purpose and layer model

```
video.json  →  tracks[] of scenes + formats
     │
     ├─ resolves React modules (paths relative to this file)
     ├─ scans scene props for audio file paths (best-effort)
     └─ composition duration = max(track lengths)
```

| Layer | Owned by | Responsibility |
|-------|----------|----------------|
| **Video** | `video.json` | Tracks, formats, fps, which modules to load |
| **Track** | One entry in `tracks[]` | One stacked lane. Index 0 paints on the bottom |
| **Scene** | One entry in `track.scenes[]` | One clip: duration, gap, props, optional fade |
| **Component** | `.tsx` module | Frame-driven pixels (and optional `<Audio>`) from props |

The JSON file is the single source of timeline truth. Components must not
hardcode global scene order or composition length.

---

## 2. File identity

| Property | Value |
|----------|--------|
| Typical filename | `video.json` (any path accepted by the CLI) |
| Encoding | UTF-8 JSON object |
| Schema | `schemaVersion: 3` |
| Validate | `pnpm first-take validate <path-to-video.json>` |

Invalid JSON, schema failures, illegal transitions, duplicate scene ids,
unsupported `visualType`, or missing referenced audio files cause validation
to fail.

---

## 3. Root object

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `schemaVersion` | `3` (literal) | yes | — | Breaking bump from v2 (`transitionIn` removed) |
| `slug` | non-empty string | yes | — | Output filename stem |
| `title` | non-empty string | yes | — | Human-readable title |
| `fps` | positive number | no | `30` | Frames per second for the whole composition |
| `formats` | `Format[]` | yes (≥1) | — | One render pass per format unless the CLI selects one |
| `assetsRoot` | string | no | `"."` | Base directory for audio paths found in scene props |
| `tracks` | `Track[]` | yes (≥1) | — | Stacked lanes; at least one track must contain a scene |

There is no root `scenes[]`, `leadIn`, or `seriesAudio`. A one-track video is
still a valid video. Opening bumpers are ordinary scenes on a visual track.

### 3.1 Format

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | non-empty string | yes | Stable id used in CLI `--format` and output names (e.g. `16x9`) |
| `aspectRatio` | non-empty string | yes | Descriptive label (e.g. `16:9`); not used for math |
| `width` | positive integer | yes | Render width in pixels |
| `height` | positive integer | yes | Render height in pixels |

All formats share the same timeline, fps, tracks, and audio. Only layout that
reads `useVideoConfig().width` / `.height` should differ per format.

### 3.2 Track

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | non-empty string | yes | Stable lane id |
| `title` | non-empty string | no | Preview label (falls back to `id`) |
| `description` | non-empty string | no | Optional preview note (studio sidebar) |
| `scenes` | `Scene[]` | yes | Clips on this lane, in order (may be empty) |

Track 0 is the bottom paint layer. Later tracks paint on top. Empty time on a
track (gaps) mounts no `Sequence`.

---

## 4. Scene object

Each scene is one clip on a track.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | non-empty string | yes | — | Unique **across all tracks** |
| `title` | non-empty string | yes | — | Human label |
| `visualType` | enum | no | `"component"` | MVP: only `"component"` is allowed |
| `component` | non-empty string | yes | — | Module path relative to the JSON file |
| `props` | object | no | — | Spread onto the default-exported component |
| `durationInFrames` | positive integer | yes | — | Local length of this scene |
| `gapBeforeFrames` | integer ≥ 0 | no | `0` | Empty frames on this track before the scene |

Fades, wipes, and other blends are **not** schema fields. Use overlapping tracks and frame-driven motion inside scene components. See [`fade-overlap`](../examples/fade-overlap/README.md) and [`circle-wipe`](../examples/circle-wipe/README.md).

### 4.1 visualType

| Value | Status |
|-------|--------|
| `component` | Supported — load React module at `component` |
| `generated-video` | Reserved — rejected in MVP validation |
| `real-video` | Reserved — rejected in MVP validation |

Real footage is embedded **inside** a component via `@levi-putna/storyboard-media` `<Video />`,
not via `visualType: "real-video"`. See [09-video-clips.md](./09-video-clips.md).

### 4.2 Component path resolution

```
resolve(dirname(video.json), scene.component)
```

`assetsRoot` does **not** apply to component paths.

The module **must** default-export a React component. See
[10-component-requirements.md](./10-component-requirements.md).

### 4.3 Props

`props` is an arbitrary JSON object. First Take does not validate prop shapes.
Prefer serialisable values. Audio file paths in props (strings ending
`.mp3` / `.wav` / `.m4a` / `.aac`) are scanned by `validate` and must exist
under `assetsRoot` unless `--no-assets`.

---

## 5. Duration math

Composition length is the **longest track**, not the sum of every scene.

Per track:

```
cursor = 0
for each scene:
  cursor += gapBeforeFrames
  scene starts at cursor
  cursor += durationInFrames
trackLength = cursor
totalFrames = max(trackLengths)
```

Implemented in `@levi-putna/storyboard-schema` as `trackDurationInFrames`,
`totalDurationInFrames`, `scenePlacements`, and `sceneStartFrames`.

A looping bed that should last the whole video is a scene whose
`durationInFrames` equals that video. Tracks do not auto-stretch.

---

## 6. Minimal and full examples

### Minimal (silent, one track)

```json
{
  "schemaVersion": 3,
  "slug": "solid-frames",
  "title": "Solid Frames",
  "fps": 30,
  "formats": [
    { "id": "16x9", "aspectRatio": "16:9", "width": 1920, "height": 1080 }
  ],
  "tracks": [
    {
      "id": "main",
      "scenes": [
        {
          "id": "01",
          "title": "Colour hold",
          "visualType": "component",
          "component": "src/scenes/Colour.tsx",
          "props": { "colour": "#112233" },
          "durationInFrames": 30
        }
      ]
    }
  ]
}
```

### Stacked overlay

See [`examples/track-overlay`](../examples/track-overlay/README.md)
(`video.json`): opaque background track, gapped
transparent overlays, optional third track for z-order.

### In-scene audio

See [`examples/hello-explainer`](../examples/hello-explainer/README.md) and
[`examples/audio-mix`](../examples/audio-mix/README.md):
visual track plus a spanning mix scene that mounts `<Audio>`.

---

## 7. Validation checklist

`pnpm first-take validate <video.json>` (via `validateVideoFile`) checks:

1. File exists and parses as JSON
2. Zod schema (`videoManifestSchema`)
3. Unique scene ids across tracks
4. Sequential transition length rules (§4.2)
5. Audio paths in scene props exist (unless `checkAssets: false`)
6. Every scene `visualType` is `"component"`

It does **not** type-check React props or execute components.

---

## 8. Project layout convention

Scaffolded by `pnpm first-take create <slug>`:

```
my-video/
  video.json
  package.json
  src/
    scenes/
  assets/
    audio/
```

`--with-audio` adds a second bed track and `src/scenes/Bed.tsx` with
`<Audio loop />`. Isolation in preview is **double-click** on a timeline clip,
not a playground registry.

This layout is conventional, not schema-enforced.

---

## 9. Compatibility

| Change | Guidance |
|--------|----------|
| v1 `scenes` / `leadIn` / `seriesAudio` | Removed. Rewrite as `tracks[]` and in-scene `<Audio>` |
| Add optional root/scene fields | Prefer backward-compatible additions; keep `schemaVersion: 3` until a break |
| Rename/remove fields or change types | Bump `schemaVersion` and update this doc + `@levi-putna/storyboard-schema` |
| v2 `transitionIn` | Removed in v3. Use overlapping tracks and in-scene fades/wipes |

Schema source of truth in code: `packages/schema/src/manifest.ts`.
