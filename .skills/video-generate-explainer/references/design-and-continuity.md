# Design and continuity checklist

Binding checks for scene planning (Gate 3), shared components (Gate 4), and
every rendered still (Gate 6 self-audit). Adapted from a generative-video
storyboard pipeline, but reframed for a code-native one: the failure mode
here is never "the model drifted from the prompt" - it's "the component was
written without considering this." Fix it by editing the component, not by
re-rolling anything.

## Continuity is a code problem, not a prompt problem

In a generative-video pipeline, continuity has to be *described* (a
paragraph about the background, palette, and props) so a black-box model
can *try* to reproduce it shot to shot - and it can still drift.

In Remotion, continuity is **structural**:

- A recurring visual (browser chrome, card, cursor, logo, background) is
  written **once** in `shared/` and imported by every scene that needs it.
  It is pixel-identical by construction - there is nothing to drift.
- Colour, type, and spacing come from **one** `shared/theme.ts` module.
  A scene component should never contain a literal hex value, a raw font
  name, or a one-off spacing number that duplicates a token.
- If you find yourself re-describing "the same card as scene 2, but..." in
  a new scene file, stop - extract it into `shared/` instead and pass the
  difference as a prop.

This means the old idea of `consistency`/`recurringElements` fields in a
scene-plan JSON is unnecessary here - don't add them. The plan just needs to
flag *what* is shared (Gate 4, step 1); the sharing itself lives in code.
The background strategy chosen at Gate 4 (blank, CSS/React-generated, or a
reused AI-generated image) is the same kind of shared, structural decision -
made once, applied everywhere it's needed, never redescribed per scene.

This "write it once" principle extends one level further, across
productions: `remotion/shared/` is the **Jumbo video kit** (theme, fonts,
Background, TrainingIntro, Intro, Outro, TermCard, CompareRow, TopicsList,
AnimatedJoe, infographics, … - indexed in `catalog.ts`). Prefer kit
components before any production-local chrome so every Foundations video
looks like the same series. See
[reusable-components.md](reusable-components.md).
A production's `shared/` is only for episode-unique motion graphics.

This checklist applies to `component` scenes directly, and to
`generated-video`/`real-video` scenes at the level a video clip can be
judged (relevance, one-focus, not fighting neighbouring scenes for
attention) - Gate 8's critic pass re-applies it across the whole assembled
video, not just per-scene stills. A scene built around a chart/graph is
still bound by every rule below (relevance, one-focus, motion restraint);
[data-visualization.md](data-visualization.md) adds category-specific
guidance (line vs. bar vs. pie, attention/labelling, simplicity ceilings)
on top of it, it doesn't replace it.

## Relevance (no empty decoration)

- Every visible object must **support the explanation** for that scene's
  narration beat.
- Don't fill the frame with idle decoration, unused UI, blank cards, or
  props that aren't part of the point being made.
- Empty/blank UI is allowed **only** when emptiness *is* the teaching point
  (e.g. "no validation message yet", "before you add the prop").
- Prefer **fewer, larger, legible** elements over a busy composition.

## One idea, one focus

- One teaching idea per scene (this is the scene's `keyPoint` from Gate 3).
  Two ideas → split the scene.
- The focal element must be nameable in about one second of looking at the
  still.
- Only the focal element should carry the scene's primary motion. Secondary
  elements stay quieter (smaller scale, less contrast, less or no motion).
- No competing hero: if two elements are fighting for attention in the
  still, mute one.

## Hierarchy

1. **Primary** - largest/highest-contrast/most motion; the thing named in
   `keyPoint`.
2. **Secondary** - smaller, flatter, quiet supporting context.
3. **Background/inert** - static; doesn't compete for attention.
4. **Negative space** - leave air around the primary; don't let secondary
   elements crowd it.

Use an explicit visual signal when teaching a state change: colour shift, a
check/cross icon, a before→after arrow, a highlight ring - whatever fits the
theme defined at Gate 4, applied consistently across scenes.

## Motion restraint

- Animate the primary element with intent; let secondary/background
  elements stay still unless their motion *is* the point.
- Prefer one clear motion beat per scene over several simultaneous ones -
  it should be obvious what moved and why.
- All motion must be driven by `useCurrentFrame()`/`interpolate()`/
  `spring()` - never CSS transitions/animations or Tailwind animation
  classes; they don't render correctly in Remotion.
- Reuse a small set of named motion presets from `shared/theme.ts` (e.g.
  `enter`, `exit`, `emphasis` spring configs) instead of inventing bespoke
  easing per scene - this is also a continuity mechanism.
- **Camera zoom/focus** (a transform on the whole UI stage) counts as the
  scene's primary motion when used - don't also run a competing full-element
  scale on the same control. Keep punch-ins subtle and sparse; see
  [camera-zoom-focus.md](camera-zoom-focus.md). When the brief is a page/
  feature walkthrough, prefer reconstructing the real screen and aiming the
  camera over inventing a disconnected collage - see
  [feature-walkthrough-reconstruction.md](feature-walkthrough-reconstruction.md).

## UI layout realism (whenever a scene shows interface chrome)

If a scene renders any mock UI - a form, button, label, nav, card, dialog,
toast - it must read as a **plausible, production-quality layout**, not a
loose collage of UI pieces. This is the structural checklist; for the
medium-specific dos/don'ts of making that mockup actually read at video
pace and size (oversizing, explicit state signals, cutting copy), see
[ui-ux-video-guidelines.md](ui-ux-video-guidelines.md):

1. **Stacking order** - label directly above its input; input directly
   above its own helper/error space; actions below the field stack, never
   inside or across it.
2. **No overlap, ever** - a badge, tooltip, highlight ring, or any
   decorative element must never cover an input's text, a label, a button
   and its label, or another control's tap target. Add spacing instead of
   letting two things touch.
3. **Readable hit targets** - buttons/inputs are bounded shapes with even
   internal padding around their label - never bare floating text, never a
   button smaller than its own label.
4. **One message per field** - inline validation anchors under the single
   field it belongs to, never spanning multiple fields.
5. **Consistent gutters** - equal spacing label→input, input→helper/error,
   field→next field.
6. **Z-order** - interactive controls are always the topmost readable
   layer; decoration sits beside or behind them, never on top.
7. **Believable chrome** - a browser/window frame or card container reads
   as an ordinary product screen with sane margins.

## Self-audit before presenting a scene (Gate 6)

Render a still at the scene's start, middle, and end frame
(`npx remotion still`, see [remotion-nextjs-setup.md](remotion-nextjs-setup.md))
and check, frame by frame:

- [ ] Could a stranger name the focal point in about one second?
- [ ] Does every visible element support this scene's narration beat?
- [ ] Is there exactly one thing carrying the primary motion?
- [ ] If UI chrome is present, does it pass the layout-realism checklist
      above at every checked frame (not just the opening one - a mid-motion
      frame is where overlap issues actually show up)?
- [ ] Does every colour/font/spacing value trace back to `shared/theme.ts`
      rather than being a one-off in this component?
- [ ] Would removing the least-relevant element on screen hurt
      understanding? If no, remove it.

On failure: fix the component (adjust JSX, props passed to a shared
component, or the `interpolate`/`spring` call) and re-render the still. This
is a normal edit-and-check loop, not a "regenerate and hope" cycle - there's
no reason to present a scene that fails this checklist.
