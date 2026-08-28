# About First Take

Product about video: a code-based editor for coding agents, then the preview studio. ElevenLabs narration over component scenes, plus a short live-editing beat on three real-footage tracks.

Planning: [brief.md](./brief.md). VO: [script.md](./script.md).

## Tracks

| Track | What it is |
|-------|------------|
| Graphics | Lead-in, then one scene per spoken beat (studio beat is a gap) |
| Screen | Placeholder (then your) preview-studio capture |
| Presenter | Placeholder (then your) talking-head PIP |
| Mouse and keyboard | Placeholder (then your) cursor / key overlay |
| Audio | Narration from frame 120 (`assets/audio/narration.mp3`) |

Working length is **5182 frames at 30fps (172.73s)**. Scene durations come from ElevenLabs alignment.

## Replace the live clips

Overwrite these files, or change the `src` props on `screen-clip`, `presenter-clip`, and `cursor-clip` in `video.json`:

| File | Track |
|------|--------|
| `assets/clips/presenter.mp4` | Talking head |
| `assets/clips/screen.mp4` | Preview studio |
| `assets/clips/cursor-keys.mp4` | Mouse and keyboard (record on black) |

See the recording table in [brief.md](./brief.md). Clip audio is muted under the VO.

## Commands

From the monorepo root:

```bash
pnpm first-take validate examples/about-first-take/video.json
pnpm first-take preview examples/about-first-take/video.json
pnpm first-take still examples/about-first-take/video.json --frame=0 --out=out/still.png
pnpm first-take render examples/about-first-take/video.json --format=16x9
```
