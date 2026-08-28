# Shared series audio: intro jingle + soft bed

## First Take mapping

When the **render target is First Take** (`video.json` / this engine), do **not**
write Remotion `seriesAudio.ts`, root `seriesAudio`, or `leadIn`. Map the mix
to `tracks[]` and in-scene `<Audio>`:

- Opening bumper → a visual scene (jingle as a prop + `<Audio>` on that scene)
- Looping bed + narration → a spanning transparent scene on an audio track
  (`durationInFrames` = video length; narration uses `startFromFrame`)
- See [`examples/hello-explainer`](../../../../examples/hello-explainer/README.md) and
  [`.doc/04-timing-and-audio.md`](../../../../.doc/04-timing-and-audio.md)

The rest of this file describes the **Remotion** explainer pipeline (Gate 7).

---

Jumbo AI training videos (and any production that opts into series audio)
share **one intro jingle** and **one soft looping soundtrack** behind the
narration. Generate them with the **ElevenLabs Music API**, store them once
in the cross-production public folder, and wire the mix in every
`Composition.tsx` at Gate 7.

Narration remains the backbone (Gate 5). Jingle and bed are **series chrome**,
not per-video re-generations.

## Defaults (Jumbo Interactive training)

| Asset | Target length | Role | Shared path |
|-------|---------------|------|-------------|
| Intro jingle | **~4 seconds** (`music_length_ms` ≈ 4000) | Brand open before VO | `public/video/_shared/intro-jingle.mp3` |
| Soft bed | **30–60 seconds** loopable (or longer if seamless) | Quiet underscore under VO | `public/video/_shared/bed-loop.mp3` |

**Lead-in:** about **4 seconds** (~120 frames at 30fps) at the start of every
composition so the jingle can play before narration. As narration starts,
**fade the jingle out** (roughly 0.4–0.8s crossfade). Do not hard-cut the
jingle under the first spoken word.

**When this is required**
- **Jumbo AI Foundations / Jumbo Interactive training videos:** always on.
- **Other explainers in this repo:** default on once the shared files exist;
  only skip if the user explicitly opts out at Gate 4 (e.g. silent social
  cut, or a one-off with no series branding).

## Gate 4 owns creation and approval

Series audio is part of Gate 4 (with theme + shared components + visual
background), not an afterthought at Gate 7.

1. **Check for existing shared files** at the paths above (and
   `remotion/shared/seriesAudio.ts` config if present).
2. **If they already exist and were approved for the series**, reuse them.
   Present the paths + lead-in/volume defaults for confirmation; do not
   regenerate per production.
3. **If missing**, generate once via ElevenLabs Music (`POST /v1/music`),
   save to the shared paths, and **play/present for user approval** before
   closing Gate 4.
4. Record prompts, model, lengths, and approval in
   `public/video/_shared/AUDIO.md` (or `remotion/shared/audio/AUDIO.md`) so
   later productions do not re-prompt from scratch.

### Prompt direction (Jumbo Interactive training)

Keep both pieces **corporate-calm, modern, lightly optimistic** - suitable
for workplace LMS training, not a game trailer or a hype product launch.

**Jingle (~4s) prompt shape:**
> Short instrumental intro sting for a workplace AI training series for
> Jumbo Interactive. About four seconds. Clean, modern, warm, professional.
> Soft electronic / light corporate underscore with a clear start and a
> gentle resolve. No vocals, no lyrics, no voiceover, no harsh drops, no
> cinematic trailer brass, no comedy stingers.

**Bed (loop) prompt shape:**
> Soft instrumental background bed for narrated workplace training videos.
> Calm, sparse, modern corporate ambient. Low dynamics so spoken narration
> stays clear. Seamless loop friendly. No vocals, no melody that competes
> with voice, no percussion that distracts.

Adjust wording with the user at Gate 4 if brand direction differs; keep
**no vocals** as a hard rule under continuous VO.

### ElevenLabs Music API (sketch)

Requires a paid ElevenLabs plan that includes Music. Same
`ELEVENLABS_API_KEY` as narration.

```bash
# Intro jingle ~4s
curl -X POST "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "<jingle prompt>",
    "model_id": "music_v2",
    "music_length_ms": 4000
  }' \
  --output public/video/_shared/intro-jingle.mp3

# Soft bed (e.g. 45s loopable bed)
curl -X POST "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "<bed prompt>",
    "model_id": "music_v2",
    "music_length_ms": 45000
  }' \
  --output public/video/_shared/bed-loop.mp3
```

If Music is unavailable on the account, stop at Gate 4 and ask the user how
to proceed (supply files manually, or temporarily ship VO-only). Do not
silently skip series audio on a Foundations video.

Optional: `ELEVENLABS_MUSIC_MODEL_ID` (default `music_v2`).

## Shared config (`remotion/shared/seriesAudio.ts`)

Create once (Gate 0/4) and import from every production Composition:

```ts
export const seriesAudio = {
  jingleSrc: "video/_shared/intro-jingle.mp3",
  bedSrc: "video/_shared/bed-loop.mp3",
  /** Seconds of pre-roll before narration / content scenes. */
  leadInSeconds: 4,
  jingleVolume: 0.55,
  /** Peak bed under VO - keep low so speech wins. */
  bedVolumeUnderVo: 0.12,
  /** Slightly higher during lead-in only if it does not fight the jingle. */
  bedVolumeLeadIn: 0.08,
  /** Frames to fade jingle out as narration starts (at 30fps ≈ 0.5–0.8s). */
  jingleFadeOutSeconds: 0.6,
  bedFadeInSeconds: 0.8,
  bedFadeOutSeconds: 1.2,
} as const;

export function leadInFrames(fps: number): number {
  return Math.round(seriesAudio.leadInSeconds * fps);
}
```

## Timeline mix (Gate 7)

Composition structure:

1. **Visual lead-in** (~4s): series bumper / `TrainingIntro` / calm brand hold
   while the jingle plays. Do not start the spoken hook under the full-level
   jingle.
2. **Content scenes**: the Gate 3/5/6 scene list, starting after the lead-in.
3. **Audio layers** (all root-level, not per scene):
   - **Jingle** - `Sequence` from frame 0; volume full during lead-in, then
     interpolate to 0 over `jingleFadeOutSeconds` as narration begins.
   - **Narration** - `Sequence` from `leadInFrames`; single
     `narration.mp3` from Gate 5.
   - **Bed** - loop for the full composition (`loopVolumeEnvelope` / Remotion
     `<Audio loop />` or repeated sequences). Stay under
     `bedVolumeUnderVo` whenever VO is present; fade out cleanly at the end.

```tsx
const leadIn = leadInFrames(fps);

<AbsoluteFill>
  {/* Visual: bumper for lead-in, then content timeline */}
  <Sequence durationInFrames={leadIn}>
    <TrainingIntro />
  </Sequence>
  <Sequence from={leadIn}>
    <TransitionSeries>{/* scenes timed to narration */}</TransitionSeries>
  </Sequence>

  {/* Audio mix */}
  <Sequence durationInFrames={leadIn + jingleFadeOutFrames}>
    <Audio
      src={staticFile(seriesAudio.jingleSrc)}
      volume={(f) => jingleVolumeAtFrame(f, leadIn, fps)}
    />
  </Sequence>
  <Sequence from={leadIn}>
    <Audio src={staticFile(`video/${slug}/narration.mp3`)} />
  </Sequence>
  <Audio
    src={staticFile(seriesAudio.bedSrc)}
    loop
    volume={(f) => bedVolumeAtFrame(f, leadIn, totalFrames, fps)}
  />
</AbsoluteFill>
```

**Total `durationInFrames`** = `leadInFrames` + (sum of scene durations −
transition overlaps) + small tail if you hold the last visual after VO ends.

## Gate 5 interaction

- Scene `audioStartSeconds` / `durationInFrames` stay **relative to the
  narration file** (unchanged math in elevenlabs-narration-sync.md).
- Record top-level in `scenes.json`:
  `"seriesAudio": { "leadInSeconds": 4, "jingle": "...", "bed": "..." }`.
- Update `brief.md` `targetLengthSeconds` to include the **+~4s lead-in**
  (and any end bed fade) when reporting runtime - content leads; the lead-in
  is series chrome, not filler inside the teaching beats.

## Loudness and mixing rules

- Narration is always the loudest continuous layer.
- Bed must never mask consonants; if in doubt, lower `bedVolumeUnderVo`.
- Mute clip-native audio under VO (existing hard rule) - bed replaces
  "ambient" needs; do not stack Veo ambience + bed + VO.
- No second jingle mid-video. No per-module re-gen of the series sting.
- End: fade bed out; no new sting after the recap (Foundations: stop on the
  teaching close / forward hook).

## Critic (Gate 8) checks

Under **script delivery / production quality**:
- Lead-in ~4s present; jingle audible then fades as VO starts (no abrupt cut).
- Bed present, looped, and clearly under the VO.
- Shared files used (not a one-off re-gen for this slug only).
- Total runtime brief includes lead-in.

## Regenerating series audio

Only re-generate when the user asks to refresh the **series** brand audio.
That is a Gate 4 change affecting every video that imports the shared paths -
flag the blast radius. Do not regenerate because one production's Gate 8
critic disliked the bed; lower volume or duck more first.
