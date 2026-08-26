# Timing and audio alignment

How Storyboard should line up picture with sound so it matches the [video-generate-explainer](../.skills/video-generate-explainer/SKILL.md) skill. Upstream gates produce narration and timings; the engine **consumes** them faithfully.

## 1. Audio-first principle

For narrated explainers:

1. Script is written for speech.
2. One continuous TTS file is synthesised for the full body script.
3. Character-level alignment yields start/end times per scene narration substring.
4. Scene `durationInFrames` is derived from those times (plus a small lead-out).
5. The video timeline is built from those durations - picture follows audio, not the reverse.

Storyboard must not invent narrated scene lengths when alignment fields are present.

## 2. Units and conversions

```
seconds → frames:  round(seconds * fps)
frames → seconds:  frame / fps
```

Use a consistent `fps` (skill default context: **30**). Store both seconds (from alignment) and frames (for the renderer) on scenes when available.

```
LEAD_OUT_FRAMES ≈ 3–5   // hold after last spoken sample so cuts do not feel clipped
durationInFrames = round((audioEndSeconds - audioStartSeconds) * fps) + LEAD_OUT_FRAMES
```

## 3. Narration file vs composition clock

| Clock | Zero point | Used for |
|-------|------------|----------|
| **Narration file** | First spoken sample of the body VO | `audioStartSeconds` / `audioEndSeconds` on scenes |
| **Composition** | Frame 0 of the rendered video | Lead-in jingle, bed, visual bumper, then content |

When series audio is enabled, **do not** bake lead-in into scene `audioStartSeconds`. Keep alignment relative to `narration.mp3`. Apply one offset when placing tracks:

```
leadInFrames = round(leadInSeconds * fps)   // typically 4s → 120 frames at 30fps
narrationSequence.from = leadInFrames
contentScenes.from = leadInFrames
```

Captions (if any) use the same offset: caption times are relative to the narration file, then shifted by `leadInFrames` on the timeline.

## 4. Series audio mix (explainer default)

Three root-level layers (not one audio element per scene):

```
Composition frame 0
│
├─ Visual lead-in (TrainingIntro / brand hold)     [0, leadInFrames)
├─ Content scenes (Series / TransitionSeries)      [leadInFrames, end)
│
├─ Jingle   from 0, fade out over ~0.4–0.8s as VO starts
├─ Narration from leadInFrames (single mp3)
└─ Bed      loop full length, ducked under VO (~0.12 peak under speech)
```

Typical defaults (from skill `shared-audio-bed`):

| Setting | Default |
|---------|---------|
| `leadInSeconds` | 4 |
| Jingle fade-out | ~0.6s as narration starts |
| Bed under VO | low (e.g. 0.12) |
| Bed during lead-in | even lower if needed so jingle wins |

**Total duration:**

```
totalFrames =
  leadInFrames
  + sum(scene.durationInFrames)
  - sum(transition.durationInFrames)
  + optionalTailFrames   // e.g. bed fade-out hold
```

## 5. Transitions and duration math

A transition of `T` frames between scene A and B **overlaps** them: both are visible (crossfading) for `T` frames. Composition length is shortened by `T` compared to playing A then B back-to-back with a hard cut.

```
naive = d0 + d1 + d2
with fades = naive - T01 - T12
```

Validate: each transition duration must be less than both adjacent scene durations.

## 6. Scene types and who owns duration

| `visualType` | Duration source |
|--------------|-----------------|
| `component` (narrated) | Alignment → `durationInFrames` |
| `component` (wordless) | Author-specified frames |
| `generated-video` | Clip length (e.g. 4/6/8s) × fps; may chain clips |
| `real-video` | Trimmed clip length × fps |

Wordless clips between narrated scenes do not shift narration character offsets; narration is one continuous file that simply has no speech during those gaps only if the script planned silence - more commonly wordless scenes sit in VO gaps or with muted clip audio under continuing VO. Follow the skill: mute clip-native audio under narration unless explicitly reviewed otherwise.

## 7. What the engine must do at render time

1. Read `fps`, `seriesAudio`, scenes, transitions from JSON.
2. Compute `leadInFrames` and `totalFrames`.
3. Mount visual lead-in for `[0, leadInFrames)`.
4. Mount scene series from `leadInFrames`, honouring transition overlaps.
5. For each scene sequence, local frame starts at 0 when that scene becomes active (Sequence semantics).
6. Schedule audio:
   - Jingle: start 0; volume envelope → 0 after lead-in crossfade.
   - Narration: start `leadInFrames`; optionally no extra trim if scene durations already include lead-out (file plays continuously).
   - Bed: loop; volume envelope ducked when VO present; fade out at end.
7. Encode with A/V sync so composition frame `f` corresponds to media time `f / fps`.

### Continuous narration vs per-scene audio

Prefer **one narration clip** from `leadInFrames` for the whole content region. Scene `audioStartSeconds` are for **authoring / validation** (does scene visual length match speech?) and captions - not for chopping narration into N files.

Sanity check (optional validate command):

```
sum over narrated scenes of (audioEnd - audioStart)
  ≈ length of narration.mp3 (within tolerance)
composition content duration ≈ that sum + lead-outs − overlaps
```

## 8. Multi-format timing

All formats share:

- `fps`
- `durationInFrames`
- narration and series audio
- scene order and transition lengths

Only `width` / `height` change. Components adapt layout via `useVideoConfig()`. Never fork timings per aspect ratio.

## 9. Determinism meets audio

Visuals are functions of frame. Audio envelopes should also be functions of frame (or of fixed JSON envelopes), so re-renders stay aligned. Do not use real-time HTMLAudioElement drift as the source of truth during **render** - use sample-accurate FFmpeg placement from the timeline metadata collected (or declared) for each layer.

At encode time, each clip’s `volumePerFrame` envelope is compiled into an FFmpeg `volume` filter (constant gain for flat envelopes, `volume='…':eval=frame` for fades and mid-timeline dips). There is no separate global track gain — a constant `volume={0.5}` is just a flat envelope.

Preview may use element seeking with an acceptable time-shift threshold (Remotion documents ~0.45s seek correction in studio); render must be exact.

## 10. Mapping from explainer skill artefacts

| Skill artefact | Storyboard input |
|----------------|------------------|
| `productions/{slug}/scenes.json` | `video.json` (or adapter) |
| `public/video/{slug}/narration.mp3` | `seriesAudio.narration` |
| `public/video/_shared/intro-jingle.mp3` | `seriesAudio.jingle` |
| `public/video/_shared/bed-loop.mp3` | `seriesAudio.bed` |
| `seriesAudio.leadInSeconds` | same |
| Gate 5 `durationInFrames` | scene durations |
| Gate 7 Composition mix | renderer audio graph |

Storyboard does not call ElevenLabs; it assumes files and numbers already exist.

## 11. Author checklist

- [ ] Narrated durations come from alignment, not guesses
- [ ] Lead-in applied once on the composition clock
- [ ] Transition overlaps subtracted from total length
- [ ] Bed ducked; jingle faded under first words
- [ ] Clip audio muted under VO by default
- [ ] Same timeline for every format
- [ ] Still at `leadInFrames` shows first content beat / VO start, not jingle-only frame (unless intentional)
