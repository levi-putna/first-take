# First Take documentation

First Take is a **video generation engine** for explainer videos. Videos are authored as pure React components, composed into scenes, and assembled from a JSON video definition. A CLI renders those artefacts into a finished MP4.

It is **inspired by** [Remotion](https://github.com/remotion-dev/remotion) (frame-driven React video), but is a **separate codebase**. No Remotion packages are imported. Patterns, timing ideas, and rendering approaches are studied from Remotion and reimplemented for this project.

## Document index

| Doc | Purpose |
|-----|---------|
| [01-core-concepts.md](./01-core-concepts.md) | Frame model, determinism, compositions, scenes, components, animation |
| [02-requirements.md](./02-requirements.md) | Product and functional requirements for First Take |
| [03-technical-requirements.md](./03-technical-requirements.md) | Architecture, stack, dependencies, CLI, project layout |
| [04-timing-and-audio.md](./04-timing-and-audio.md) | How video lines up with narration and series audio (explainer skill) |
| [05-remotion-research.md](./05-remotion-research.md) | Research notes from Remotion docs and architecture |
| [06-video-json-schema.md](./06-video-json-schema.md) | Normative `video.json` / scene-file specification |
| [07-authoring-guide.md](./07-authoring-guide.md) | How to write frame-driven components and use the CLI |
| [08-testing-strategy.md](./08-testing-strategy.md) | Test pyramid, fixtures, golden stills, accuracy contract |
| [09-video-clips.md](./09-video-clips.md) | Real footage via `<Video />` (trim, PIP, overlays) |
| [10-component-requirements.md](./10-component-requirements.md) | Normative requirements for scene / lead-in components |
| [11-single-package-publish.md](./11-single-package-publish.md) | **Proposal:** publish one `@levi-putna/storyboard` instead of seven |

Playable example catalogue: [`examples/README.md`](../examples/README.md). Studio UI: [README.md § Preview](../README.md#preview).

> Note: `.skills/video-generate-explainer` still mentions Remotion APIs in places. First Take is the engine those artefacts should target; field mapping is in [04-timing-and-audio.md](./04-timing-and-audio.md).

## Design intent (short)

1. **Pure React components** are the atomic unit - previewable and testable with different props; changing props re-runs the animation from frame 0.
2. **Scenes** compose those components with scene-specific data and timing.
3. A **JSON video file** defines scenes, transitions, formats, and overarching assets (e.g. narration + bed across the whole timeline).
4. A **CLI** builds the video from components, assets, and that JSON definition.
5. Timing must align with the [video-generate-explainer](../.skills/video-generate-explainer/SKILL.md) skill: audio-first narration, frame durations derived from speech alignment, optional series jingle lead-in and soft bed.

## Non-goals (for this engine)

- Live-action / documentary editing as the primary path
- Importing or wrapping Remotion as a dependency
- Wall-clock CSS / Tailwind animation as the motion system
