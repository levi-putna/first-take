# ElevenLabs narration + scene timing sync

This is the mechanism that makes the Remotion video **exactly** line up
with the narration - no manual guessing, no snapping to fixed buckets. It
applies to **component scenes and any narrated video scene**. A wordless
`generated-video`/`real-video` scene (empty `narration`) has no alignment
work to do - its duration comes from the clip itself (see
video-image-generation.md and step 3 below).

## 1. One synthesis call for the whole body script

Concatenate every scene's non-empty `narration` field (space-joined, in the
order they appear in `scenes.json`, skipping wordless video scenes) into a
single string - this must equal the approved body script from Gate 2. Call
the timestamped synthesis endpoint **once** with that full string. Longer
scripts consume more of the ElevenLabs account's audio-generation
credits/quota per call (cost scales with character count) - this should
already have been flagged to the user at Gate 1 if `targetLengthSeconds`
was likely to exceed 5 minutes, so this call itself needs no extra
confirmation, just the awareness that it's the point the cost is actually
incurred:

```
POST https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/with-timestamps
xi-api-key: {ELEVENLABS_API_KEY}
Content-Type: application/json

{
  "text": "<full concatenated body script>",
  "model_id": "eleven_multilingual_v2"
}
```

Response:

```json
{
  "audio_base64": "...",
  "alignment": {
    "characters": ["H", "e", "l", "l", "o", " ", "..."],
    "character_start_times_seconds": [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    "character_end_times_seconds": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
  },
  "normalized_alignment": { "...": "same shape, over ElevenLabs' normalised text" }
}
```

Decode `audio_base64` and write it to `public/video/{slug}/narration.mp3`.
Write the `alignment` object to `productions/{slug}/audio/alignment.json` -
useful for debugging/re-deriving timings later, but not required at render
time once `scenes.json` has been updated (step 2).

**Series lead-in:** scene timings below are relative to the narration file
(audio second 0 = first spoken sample). At Gate 7 the composition offsets
the narration track (and content scenes / captions) by
`seriesAudio.leadInSeconds` (~4s) so the shared intro jingle can play first.
Do **not** bake that lead-in into `audioStartSeconds` on each scene - keep
alignment math clean and apply the offset once in `Composition.tsx`. See
[shared-audio-bed.md](shared-audio-bed.md).

Use `alignment` (not `normalized_alignment`) for the character-offset
matching below, since it lines up with the exact text you sent, including
any `<break>` tags you may have left in the source string (ElevenLabs
consumes break tags as timing instructions, not spoken characters - they
won't appear in `characters`, so offset matching still works against your
original text once you strip the tags the same way before matching).

## 2. Map each scene to a start/end time

Walk the full concatenated string and each scene's `narration` substring in
order, tracking a running character cursor, to find each scene's start/end
index into the `alignment.characters` array. Example (Node/TS):

```ts
type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type SceneTiming = {
  id: string;
  audioStartSeconds: number;
  audioEndSeconds: number;
};

function computeSceneTimings(
  scenes: { id: string; narration: string }[],
  fullText: string,
  alignment: Alignment,
): SceneTiming[] {
  const timings: SceneTiming[] = [];
  let cursor = 0;

  for (const scene of scenes) {
    const startIndex = fullText.indexOf(scene.narration, cursor);
    if (startIndex === -1) {
      throw new Error(
        `Scene ${scene.id} narration not found in full script at or after index ${cursor} - ` +
          `check scenes.json narration matches script.md exactly (including punctuation).`,
      );
    }
    const endIndex = startIndex + scene.narration.length - 1;

    timings.push({
      id: scene.id,
      audioStartSeconds: alignment.character_start_times_seconds[startIndex],
      audioEndSeconds: alignment.character_end_times_seconds[endIndex],
    });

    cursor = endIndex + 1;
  }

  return timings;
}
```

## 3. Convert to `durationInFrames` and write back to `scenes.json`

```ts
const LEAD_OUT_FRAMES = 4; // small buffer so speech doesn't cut the instant audio stops

function toDurationInFrames(
  timing: SceneTiming,
  fps: number,
): number {
  const rawFrames = Math.round(
    (timing.audioEndSeconds - timing.audioStartSeconds) * fps,
  );
  return rawFrames + LEAD_OUT_FRAMES;
}
```

Write `audioStartSeconds`, `audioEndSeconds`, and `durationInFrames` back
onto each **narrated** scene object in `scenes.json`. For a wordless video
scene, set `durationInFrames` directly from the clip length instead
(`videoSource.durationSeconds * fps` for a generated clip, or the trimmed
real-clip length) - there's no alignment to derive it from. These are the
values Gate 7 uses to build the `<TransitionSeries>`/`<Series>` timeline -
**do not** guess or hand-author the narrated ones.

Sanity-check after writing: no scene should end up with `durationInFrames`
so small it can't fit its own transition (see
[remotion-nextjs-setup.md](remotion-nextjs-setup.md) for how transition
overlap is subtracted from total duration). If a scene's narration is very
short, either lengthen the copy at Gate 2/3 or shorten its transition.

**Then re-sum the whole timeline** (every scene's `durationInFrames`, minus
transition overlaps) and confirm it's still close to the brief's approved
`targetLengthSeconds` now that real numbers exist - the Gate 3 estimate was
necessarily approximate. There is no fixed cap; if it's drifted
meaningfully from the approved target, cut/tighten (or expand) a scene now,
before Gate 6 builds anything on top of these numbers, or revisit the
target with the user if the content genuinely needs the difference.

## 4. Optional: captions from the same alignment

If the user asked for on-screen captions, convert the character-level
alignment into `@remotion/captions`' word-level `Caption` type - group
consecutive non-space characters into words, using the first character's
start time and the last character's end time:

```ts
import type { Caption } from "@remotion/captions";

function alignmentToCaptions(alignment: Alignment): Caption[] {
  const captions: Caption[] = [];
  let wordChars: string[] = [];
  let wordStart = 0;

  const flushWord = (endTimeSeconds: number) => {
    if (wordChars.length === 0) return;
    captions.push({
      text: wordChars.join(""),
      startMs: wordStart * 1000,
      endMs: endTimeSeconds * 1000,
      timestampMs: null,
      confidence: null,
    });
    wordChars = [];
  };

  alignment.characters.forEach((char, i) => {
    if (char.trim() === "") {
      flushWord(alignment.character_end_times_seconds[i - 1] ?? 0);
      return;
    }
    if (wordChars.length === 0) {
      wordStart = alignment.character_start_times_seconds[i];
    }
    wordChars.push(char);
  });
  flushWord(
    alignment.character_end_times_seconds[alignment.characters.length - 1],
  );

  return captions;
}
```

Save the result as a plain data file, `productions/{slug}/captions.ts`
(`export const captions: Caption[] = [...]`), so the composition can import
it directly with no runtime fetch. Feed it to `createTikTokStyleCaptions()`
and render pages with `<Sequence>` + word highlighting exactly as described
in the Remotion captions docs/skill (see
[remotion-nextjs-setup.md](remotion-nextjs-setup.md) → "Captions"). Skip
this whole step if captions weren't requested - don't add caption UI to a
production nobody asked to have captions.

## 5. Re-running after a script change

If narration text changes for any scene, the character offsets for every
*later* scene shift too - always re-run the full synthesis + timing-sync
computation for the whole production, never patch a single scene's timing
by hand.
