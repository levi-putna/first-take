# The comparison content formula

A content *shape* to reach for at Gate 2/3 whenever the video's one idea is
naturally a contrast - right vs. wrong, before vs. after, too-little vs.
too-much. Distilled from studying published short-form UI/UX pattern videos
(e.g. designmotionhq's "Animation Timing," "Card Hover Anatomy," "Dropdown
Design" breakdowns - same 9:16 comparison-driven format that runs on
Instagram and their site). Those run 45-60s across 4-6 chapters - close to
this skill's own ~1-minute default, so at that length the shape maps over
fairly directly (a chapter per contrast). At a shorter approved target the
job is compressing the same *shape* into one or two beats; at a longer
approved target there's room to actually run several distinct
chapters/contrasts, closer to the source material's own structure.

**Use this formula when** the brief is "X is subtle/easy to get wrong" -
timing, spacing, a threshold, an easing choice, a state that's easy to skip.
**Skip it when** the brief is a straight feature reveal/walkthrough with
nothing to contrast against - don't force a fake "wrong way" onto a video
that's just introducing something new.

## The core formula

> Isolate one variable. Show it wrong and right in the same frame. Label
> both sides twice. Let the number be the payload.

1. **Isolate one variable.** Not "our modal transition" - specifically its
   entrance duration, or specifically its easing curve. One controllable
   number or choice per beat (this is the same discipline as
   [design-and-continuity.md](design-and-continuity.md)'s one-idea-one-focus
   rule, applied to the *content*, not just the visual composition).
2. **Show both sides in the same frame, not sequentially.** A viewer
   shouldn't have to remember what "bad" looked like 8 seconds ago while
   looking at "good" now. Side-by-side (2-3 up) or stacked (2 up) in one
   shot, exactly as scale/layout allows without cramping - default to
   stacked (top/bottom) for a 9:16 frame where side-by-side would shrink
   each variant below the "oversize for legibility" rule in
   [ui-ux-video-guidelines.md](ui-ux-video-guidelines.md).
3. **Label both sides twice** - a qualitative tag and the literal value (see
   "the label system" below). Never leave a viewer to infer which side is
   which from the animation alone; the mute-by-default reality means the
   label carries the meaning, not the narration.
4. **The number is the payload.** The takeaway should be quotable and
   screenshot-able even muted: `250ms`, `~8px`, `60ms apart`. Pick the
   exact figure before writing the scene - it belongs in `keyPoint` (Gate 3)
   and should usually be spoken in the narration too, not invented
   separately for the on-screen label.

## Anatomy of a beat, sized to the approved target length

The source material spends a full chapter (5-10s) on scene-setting before
the payoff. A short approved target (well under a minute) usually doesn't
have that budget - collapse a chapter to roughly this shape inside one
scene, or across two adjacent scenes if the contrast genuinely needs a beat
each. A ~1-minute or longer target can afford a fuller chapter (a beat of
scene-setting, then the contrast) closer to the source material's own
pacing - use judgement based on what was actually agreed at Gate 1 rather
than compressing just because the format is capable of it:

1. **Cold open on the contrast itself** (frame one, per
   [production-quality-guidelines.md](production-quality-guidelines.md)'s
   hook rule) - not a title card first, then the demo. Both variants (or
   the before/after) should already be visible or land within the first
   second.
2. **Labels resolve almost immediately** - the qualitative tag and the
   number appear with the variants, not after a delay while the viewer
   guesses.
3. **One short beat of motion** demonstrating the actual behaviour (the
   hover, the entrance, the drag) - per
   [design-and-continuity.md](design-and-continuity.md)'s motion-restraint
   rule, only the demonstrated element moves.
4. **Land on the correct variant** - end the scene/video with emphasis on
   the "right" side (a colour pulse, a checkmark, a slight scale-up), not
   symmetric weighting between both - the viewer should leave knowing which
   one to copy.

## The label system

Three label layers, consistently seen across every pattern reviewed. Build
each as a small `shared/` component (production-level, promote to
`remotion/shared/` once a second production wants the same look) rather
than one-off JSX per scene:

| Layer | What it says | Example | Notes |
|---|---|---|---|
| **Chapter/state pill** | A short uppercase tag | `RULE 2`, `02 · GLOW`, `TOO SLOW`, `✓ CORRECT` | Small, rounded, sits above the thing it labels. Wording varies per topic (numbered rule vs. named secret vs. a pass/fail tag) - pick whichever reads clearest for this specific contrast, don't force one template.
| **Two-tone headline** | The rule, in one short sentence | "Flip on **edge**.", "Claim **the cursor**." | Neutral colour for the sentence, the theme's accent colour on the one word/phrase that *is* the point. Drive the accent word from the scene's `keyPoint`, not a separate copy pass. |
| **Mechanism caption** | The literal parameters, small print | `heart · cart · share · stagger(60ms)` | Optional, only when the number alone doesn't fully specify the behaviour (a sequence, a list of what's staggered). Monospace or letter-spaced small caps reads as "spec," not decoration. |

Map this onto `scenes.json`: `keyPoint` drives the headline's accent word,
and it's worth adding a lightweight `label` field (qualitative tag + literal
value, e.g. `{ tag: "PERFECT", value: "250ms" }`) per variant when a scene
is built this way, rather than burying the numbers only in `visualNotes`
prose where the Gate 6 component build has to re-derive them.

## Colour as state, not decoration

This skill stays style-agnostic (Gate 4 picks the palette per project) - but
the *pattern* of using colour to carry meaning is worth adopting regardless
of palette: reserve one accent for "correct/premium," one for "wrong/cheap,"
and (optionally) a third for "attention-grabbing" if a beat calls for it.
Define these as named tokens in the production's `theme.ts` (e.g.
`colors.good` / `colors.bad` / `colors.attention`) alongside the existing
`motion` presets, so a scene component reads `theme.colors.good` rather than
a literal hex - same discipline as every other themed value in
[design-and-continuity.md](design-and-continuity.md).

## The "trap" close

Several patterns reviewed end their positive rules with one dedicated
"here's the mistake to avoid" beat before landing (e.g. Card Hover
Anatomy's closing rule: "never scale the whole card - it shifts
neighbours"). At a short approved target this usually can't be its own
scene, but it's worth one closing sentence + a quick negative-state flash in
the last scene when the topic has an obvious, common mistake - it gives the
closing line somewhere to land besides just repeating the "correct" state.
At a longer approved target, this can be promoted to its own brief closing
beat/scene instead of being folded into the last one.

## Motion values worth borrowing

Concrete, tested-in-the-wild numbers from the reviewed patterns - useful
starting points for this production's own `shared/theme.ts` presets rather
than guessing at a feel from scratch. Convert ms to frames
(`Math.round(ms / 1000 * fps)`) for `interpolate()`, or use as a rough feel
target when tuning a `spring()` config:

| Motion | Value | Use for |
|---|---|---|
| Entrance | 200-300ms, ease-out | Modals, cards, anything appearing - `motion.enter` |
| Exit | ~40% faster than its own entrance | Dismissals - never symmetric in/out timing |
| Tap/press feedback | <100ms | Anything responding to a click - must feel instant |
| Attention/alert | 500-800ms, with overshoot/bounce | `motion.playful` - notifications, error shakes, rare and deliberate |
| List stagger | 40-60ms between items | Cascading reveals - see `design-and-continuity.md`'s motion-restraint rule; still only one *kind* of motion happening |
| Hover lift | ~8px translate + shadow grows with it, ~200ms ease-out | Card/button hover - move the shadow together with the element, not independently |
| Image "push" on hover | Scale contents ~1.05 inside an `overflow: hidden` frame; never scale the outer container | Keeps layout geometry fixed - the container never resizes or shifts a neighbour |

## Worked example (single short beat)

Brief: "Explain why our dropdown opens upward near the bottom of the
screen." One variable (menu direction), one contrast (clips off-screen vs.
flips to stay visible).

```json
{
  "id": "02",
  "title": "Flip on edge",
  "visualType": "component",
  "narration": "Near the bottom of the screen? The menu flips up instead of clipping off.",
  "keyPoint": "Menu flips upward instead of clipping",
  "onScreenText": "RULE · Flip on edge",
  "visualNotes": "Mock app window (minimal chrome - title bar dots only, per ui-ux-video-guidelines.md). Trigger sits near the bottom safe margin. Menu opens downward first (label: 'CLIPS OFF-SCREEN', accent=bad), cross-dissolves to the same trigger opening upward and fully visible (label: 'STAYS VISIBLE', accent=good). Land on the upward state."
}
```

The narration states the mechanism in plain speech (per
[audio-first-script.md](audio-first-script.md)'s speakable-wording rule);
the on-screen labels restate it visually for muted viewing; the scene
briefly shows the "wrong" state before resolving to the "right" one rather
than only ever showing the fix.

## Self-audit

Fold into the Gate 2/3 review, alongside the existing script and scene
checklists:

- [ ] Is there exactly one variable being isolated, not a blended claim?
- [ ] Would a muted viewer know which side is "correct" from labels alone?
- [ ] Does the on-screen number match what's spoken in the narration
      (not invented separately)?
- [ ] Is the qualitative tag + literal value pairing present on every
      variant shown, not just the "correct" one?
- [ ] If a "trap"/mistake is mentioned, does the video land on the correct
      state afterward rather than ending on the mistake?
