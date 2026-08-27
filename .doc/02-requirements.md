# Product requirements

Storyboard is a general-purpose, frame-deterministic React video engine. Requirements below adapt Remotion's proven ideas: pure React components, track + JSON assembly, CLI build, and in-scene audio.

## 1. Goals

| ID | Goal |
|----|------|
| G1 | Author videos as React UI, not as generative black-box clips (clips allowed as exceptions later). |
| G2 | Guarantee frame-accurate, deterministic output so the same artefacts always produce the same file. |
| G3 | Let authors preview a single scene in isolation (double-click on the timeline) with live prop overrides. |
| G4 | Assemble a full video from a declarative JSON definition plus component and media artefacts. |
| G5 | Provide a CLI that builds video(s) from those artefacts for local and CI use. |
| G6 | Align timing and audio with in-scene `<Audio>` (Sequence-relative clips; looping beds as full-length tracks). |

## 2. Non-goals

| ID | Non-goal |
|----|----------|
| NG1 | Depend on or re-export any Remotion package. |
| NG2 | Replace the full explainer *production pipeline* (brief, script, ElevenLabs, critic gates) - Storyboard is the **render/runtime** those artefacts feed. |
| NG3 | Primary support for live-action NLE-style editing. |
| NG4 | Wall-clock CSS animation as a supported motion path. |

## 3. Personas and jobs

- **Component author** - builds reusable motion graphics; needs isolation preview and prop knobs.
- **Scene author / agent** - wires components + data into scenes timed to narration.
- **Pipeline / CI** - runs the CLI to produce `final.mp4` (and multi-format variants) without a GUI.
- **Explainer skill** - produces `scenes.json`-like manifests, narration, and assets that Storyboard consumes.

## 4. Functional requirements

### 4.1 Components

| ID | Requirement |
|----|-------------|
| F-C1 | Components are standard React function components with typed props. |
| F-C2 | Components drive all motion from the engine's current-frame API (local to their sequence). |
| F-C3 | A scene can be isolated in preview; changing sidebar props is a live override until Save writes them to `video.json`. |
| F-C4 | Shared / kit components are importable by many scenes without forking. |
| F-C5 | Components read `width` / `height` / `fps` from video config for multi-format layout. |

### 4.2 Scenes

| ID | Requirement |
|----|-------------|
| F-S1 | A scene references a component module (or clip source) and supplies props / data for that beat. |
| F-S2 | A scene declares or receives `durationInFrames` (for narrated component scenes, derived from audio alignment upstream). |
| F-S3 | Fades and wipes are authored in scene components (frame-driven opacity or masks). |
| F-S4 | Scene types at minimum: `component`; design for later `generated-video` and `real-video` without blocking v1. |
| F-S5 | Scenes may include empty narration (wordless beats) with clip- or author-defined duration. |

### 4.3 Video definition (JSON)

| ID | Requirement |
|----|-------------|
| F-V1 | One JSON file defines a single video (`schemaVersion` 3: slug, title, fps, formats, `tracks[]`). |
| F-V2 | Formats are an array of `{ id, aspectRatio, width, height }`; one render pass per format from the same timeline. |
| F-V3 | Audio is in-scene (`<Audio>` / unmuted `<Video>`); file paths typically live in props. |
| F-V4 | Total `durationInFrames` is the longest track (gaps + scene durations). |
| F-V5 | The schema is versioned (`schemaVersion`) so the CLI can reject or migrate old manifests. |
| F-V6 | Asset paths in the JSON resolve relative to a known project root / public dir. |

Example shape (illustrative, not final schema):

```json
{
  "schemaVersion": 3,
  "slug": "example-feature",
  "title": "Example feature",
  "fps": 30,
  "formats": [
    { "id": "16x9", "aspectRatio": "16:9", "width": 1920, "height": 1080 }
  ],
  "tracks": [
    {
      "id": "visual",
      "scenes": [
        {
          "id": "01",
          "title": "Hook",
          "visualType": "component",
          "component": "src/scenes/01-Hook.tsx",
          "props": { "headline": "You hit Tab. Nothing highlights." },
          "durationInFrames": 90
        }
      ]
    },
    {
      "id": "visual-b",
      "scenes": [
        {
          "id": "02",
          "title": "Fix",
          "visualType": "component",
          "component": "src/scenes/02-Fix.tsx",
          "props": {},
          "durationInFrames": 120,
          "gapBeforeFrames": 75
        }
      ]
    }
  ]
}
```

### 4.4 Timeline and transitions

| ID | Requirement |
|----|-------------|
| F-T1 | Scenes play in track order; later tracks paint on top. |
| F-T2 | Blends use overlapping tracks; motion (fade, wipe) lives in scene components. |
| F-T3 | Same-lane clip overlap is forbidden; gaps separate clips on one track. |
| F-T4 | A continuous background is a full-length scene on a lower track (see [`examples/track-overlay`](../examples/track-overlay/README.md)). |

### 4.5 Audio

| ID | Requirement |
|----|-------------|
| F-A1 | Support multiple simultaneous audio layers with frame-based volume envelopes. |
| F-A2 | Narration is an `<Audio>` clip, typically delayed with `startFromFrame` on a spanning mix scene. |
| F-A3 | Jingle plays from the opening visual scene and fades out as narration starts. |
| F-A4 | Soft bed can loop for a full-length scene/track and duck under VO. |
| F-A5 | Clip-native audio for video scenes can be muted by flag (default mute under narration). |
| F-A6 | Encode muxes all layers into the final file. |

### 4.6 Preview and tooling

| ID | Requirement |
|----|-------------|
| F-P1 | Dev preview: scrub frames, play, jump to scene boundaries. |
| F-P2 | Isolate a scene from the timeline (double-click); sidebar edits props as a live override; drag clips to reposition or trim; manage tracks (add, title, description, render order); Save writes props and timeline edits to `video.json`. |
| F-P3 | Still capture: export PNG of a given composition frame (for QA stills). |
| F-P4 | Clear errors when a component uses non-deterministic patterns (lint / docs; automated detection where practical). |

### 4.7 CLI

| ID | Requirement |
|----|-------------|
| F-CLI1 | `storyboard render <video.json>` produces MP4 (or path override). |
| F-CLI2 | `storyboard still <video.json> --frame=N --out=…` captures a still. |
| F-CLI3 | `storyboard preview` / studio entry for interactive authoring. |
| F-CLI4 | `storyboard validate <video.json>` checks schema, asset existence, and duration math. |
| F-CLI5 | Multi-format: render all formats or `--format=16x9`. |
| F-CLI6 | Exit non-zero on missing assets, schema errors, or render failure. |
| F-CLI7 | Concurrency / quality flags for render performance. |

### 4.8 Rendering guarantees

| ID | Requirement |
|----|-------------|
| F-R1 | Frame N always yields the same pixels for the same inputs (bit-identical or visually identical within codec tolerance). |
| F-R2 | Parallel frame rendering must not change output vs sequential. |
| F-R3 | Capture waits for registered async readiness (fonts, images, delay handles). |
| F-R4 | Output supports at least H.264 MP4 at 1080p; 4K is optional but not blocked by design. |

### 4.9 Explainer skill compatibility

| ID | Requirement |
|----|-------------|
| F-E1 | Consume a scenes manifest conceptually equivalent to the skill's `scenes.json` (field mapping documented). |
| F-E2 | Honour narration-derived `durationInFrames` when mapping from the explainer skill. |
| F-E3 | Opening bumper is a visual scene; mix uses in-scene `<Audio>` (not `seriesAudio`). |
| F-E4 | One continuous narration file spanning content scenes (not one file per scene). |
| F-E5 | Multi-format registration from the same composition component / timeline. |

## 5. Quality attributes

| Attribute | Expectation |
|-----------|-------------|
| Correctness | Deterministic frames; audio sync within one frame of intended start. |
| Performance | Concurrent frame capture; usable local render for ~1–5 minute 1080p videos. |
| Authoring UX | Hot reload in preview; fast stills for gate-style QA. |
| Extensibility | New transitions, scene visual types, and audio layers without schema breakage (version bumps). |
| Portability | macOS and Linux CI; Chrome/Chromium + FFmpeg as system deps. |

## 6. Success criteria (MVP)

1. A hand-authored React component scene list + JSON renders to MP4 via CLI.
2. Scrubbing frame 0 and frame mid-fade in stills shows expected opacity (frame-driven motion proven).
3. Narration + 4s jingle lead-in + ducked bed mix matches the skill's Gate 7 model.
4. Two formats (16:9 and 9:16) from one JSON produce two correctly sized files with identical duration.
5. Isolating a scene from the timeline can re-run it with different props without editing the video JSON.

## 7. Out of scope for MVP (track for later)

- Full Remotion Studio parity (complex timeline UI)
- Lambda / cloud distributed render
- Built-in ElevenLabs synthesis (stays in the skill / callers)
- Captions pipeline (schema hooks OK; rendering can follow)
- Rich transition library beyond fade
- Client-side-only web renderer
