# Audio-first narration script

The script exists to be **spoken by ElevenLabs**, not read on screen. Write
for the ear: a real person explaining something, with natural flow and human
pacing. On-screen text/captions are a secondary layer added later - never
write the script as if it were the on-screen copy.

**Word budget is a working estimate from Gate 1's `targetLengthSeconds` -
there is no fixed cap.** Use it to size ambition, not to crush teaching.
**Content coverage leads; length follows.** Write the must-land properly at
a natural pace first, then count words, estimate runtime, and update
`brief.md` if the estimate moved. A short target (15-20s) has roughly 40-50
spoken words of body VO and no room for a slow wind-up; a ~1-minute target
has room for ~130-150 words and a few more beats; a multi-minute target has
room for real scene-setting and several distinct sections. Whatever the
length, the opening line still has to work as the hook itself - a longer
runtime buys more room *after* the hook, not permission to lead into one a
few seconds later.

## What "natural" means here

| Aim | Avoid |
|-----|--------|
| Calm, precise, invitational ("you'll", "you and I") | Brochure / marketing-carousel copy |
| Contractions where natural | Stiff formal prose |
| Thoughtful longer lines + short landings | Same-length staccato hype march |
| Breath space after wonder, purpose, key claim, limit, reframe | One continuous paragraph wall |
| Ideas you can say in one breath per beat | Nested clauses, stacked jargon |
| Wonder hook on a concrete thing, then structured path | Agenda / "welcome to module" wind-up |
| Motivate structure before dense labels | Taxonomy dump in the first minute |
| Honest limit where overconfidence is a risk | Fake certainty, fear-mongering, or demo hype |

House presenting craft (3Blue1Brown-inspired calm visual explainer) is
defined in `designing-training-videos` →
[presenting-style.md](../../designing-training-videos/references/presenting-style.md).
For **AI Foundations** videos, the beat sheet in
[`courses/notes/jumbo-ai-video-structure-guide.md`](../../../courses/notes/jumbo-ai-video-structure-guide.md)
**overrides** the generic short/multi-minute beat counts below. Use the
guide's six beats (or the short / scenario / compliance variants), word
budgets, and `[PAUSE]` rules. For a dedicated authenticity critique before
Gate 5, use **`video-review-authenticity`**.

## Flow and pace

Beat count should fit the *content*, with Gate 1's target as a starting
guide - don't force a 15-second shape into a multi-must-land brief, and
don't pad a thin idea out to fill a number. If covering the topic properly
needs more time, expand the script and update `targetLengthSeconds`:

**AI Foundations (required shape):**

| Runtime | Words | Beats |
|---------|-------|-------|
| 3 min | ~420 | Hook, Concept, Name it, In the wild, So what, Recap (or four-beat collapse if under 3) |
| 5 min | ~700 | Same six beats, scaled |
| 6 min | ~850 | Default |
| 7 min | ~980 | Same six beats, scaled |
| Cap | 8 min | Split rather than cut "in the wild" or Recap |

Label scripts with `[BEAT 1: HOOK]` … `[BEAT 6: RECAP]`. Zero new terms in
Concept. Three-line Recap, then stop.

**Non-Foundations / marketing explainers:**

- **Short target (roughly ≤30s)**: three or four beats, no more. Compress
  to the single idea this video is for.
- **Around the ~1-minute default**: five to seven beats - room for a short
  context/problem beat before the payoff, and a slightly fuller landing,
  but still one throughline, not a list of unrelated points.
- **Multi-minute target**: organise into a small number of clearly-labelled
  sections (each with its own mini hook → show it → land arc), rather than
  one long undifferentiated ramble. Chapter/section labels on screen (see
  [content-formula.md](content-formula.md)'s label system for one way to do
  this) help a viewer track where they are.

Whatever the length (non-Foundations), the shape itself stays:

1. **Hook** - the opening line itself must establish why this matters and
   grab attention on frame one. There's no separate "lead-in" before it,
   regardless of overall length. For Foundations: meeting moment, no agenda,
   no definitions.
2. **Show it** - the problem, the feature, or the fix. For Foundations this
   is Concept → Name it → In the wild.
3. **Contrast or confirmation** (optional for non-Foundations) - a beat that
   sharpens the point. For Foundations: So what.
4. **Land** - closing line/beat. For Foundations: exactly three recap lines,
   then stop (no "see you next video").

Pace like speech, not typesetting:

- Prefer **punctuation and sentence rhythm** for most pauses (commas, full
  stops, colons). **Never use an em dash (—)** in narration, on-screen
  copy, or anywhere else this skill writes - use a spaced hyphen (` - `),
  a comma, or a full stop instead (hard rule in the main SKILL.md).
- Use ElevenLabs `<break time="0.3s" />` / `0.5s` deliberately, scaled to
  length - as a rough feel, roughly one natural breath point every 10-15
  seconds of runtime (after the hook, between beats/sections, before the
  final line) rather than a fixed count. For Foundations, also mark
  `[PAUSE]` after every new term and before the recap (map those to breaks
  at synthesis time).
- Vary rhythm: mix a punchy line with a slightly longer one. Don't write
  every sentence the same length. Foundations beat 2: keep sentences under
  20 words.
- Aim ~140-150 spoken words per minute (Foundations lock). Use
  `targetLengthSeconds / 60 * 140` as a **working word estimate**, not a
  hard cap. Count words after the content is right; if natural delivery
  overshoots or undershoots the Gate 1 guess, update `brief.md` rather than
  starving must-land or inventing filler. Leave headroom for breath-point
  pauses.

## Speakable wording (ElevenLabs-friendly)

- Write words the way they're said. Prefer "jane at example dot com" over a
  raw email address; describe code intent in plain language rather than
  reading punctuation/syntax aloud.
- **Never read code, selectors, file paths, or symbol-heavy syntax aloud.**
  Describe intent in plain language ("set the environment variable for your
  API key" rather than reading `ELEVENLABS_API_KEY=sk-...` character by
  character). Point denser detail to on-screen text/captions instead.
- Expand awkward digits/symbols into speech ("two pixels", "twenty
  twenty-six", "v4" → "version four").
- No tongue-twister jargon chains - split or paraphrase.
- Each scene's `narration` slice (see Gate 3) must be a **complete speakable
  unit** that still flows into the next when the full script is joined - no
  mid-clause cliffhangers unless the following scene finishes the thought.

## Tone and voice

Audience/tone is confirmed once at Gate 1 (the planning brief) - who's the
audience, how formal/casual, first- or second-person address, and whether
it's teaching a concept, walking through a UI, or demoing a feature
end-to-end. Read that decision from `brief.md` rather than re-asking at
Gate 2, and keep it consistent for the rest of the production - don't
drift tone scene to scene.

For **Jumbo AI training** productions in this repo, also apply the house
presenting style in
[presenting-style.md](../../designing-training-videos/references/presenting-style.md)
and `DESIGN.md` Voice (AU English, curiosity over fear, no sci-fi baggage).
That style is a calm visual explainer: wonder hook, structured intro,
motivate-then-show - not sterile L&D, and not high-energy demo cosplay.

## Gate 2 self-check (before presenting)

- [ ] No em dashes (—) anywhere in the script - use commas, full stops,
      colons, parentheses, or a spaced hyphen (` - `) instead
- [ ] Sounds like a thoughtful guide beside a diagram, not a page excerpt
- [ ] Opens on a concrete thing + tension; no lead-in chrome before it
- [ ] Structured intro lands purpose + short path within ~45–60s
- [ ] Concepts start simple, then layer; structure motivated before dense labels
- [ ] VO cues something showable on screen
- [ ] Sentence rhythm can be longer and thoughtful; still speakable
- [ ] The shape (wonder → orient → build → limit → reframe) is clear by ear
- [ ] Has breathing room scaled to length (punctuation and/or break tags
      roughly every 10-15s of runtime, not more)
- [ ] No brochure verbs or tool-demo hype stack
- [ ] No code/selector/path read-through
- [ ] **Spoken runtime estimated** at ~130-150 wpm; if it differs from
      Gate 1's `targetLengthSeconds`, update `brief.md` (content leads;
      length follows) - don't starve must-land or pad filler to hit a guess
- [ ] Carries one clear throughline - a short target with a multi-point
      takeaway is a sign the brief is too big for that length; either narrow
      the scope *or* expand the target with the user instead of rushing it
- [ ] Tone is consistent with what was confirmed with the user
- [ ] If authenticity feels uncertain, run **`video-review-authenticity`**
      before approving Gate 2
