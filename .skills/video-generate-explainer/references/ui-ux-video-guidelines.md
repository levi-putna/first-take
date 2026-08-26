# Rendering UI/UX in video

Dos and don'ts for any scene that shows product UI - a mockup screen, a
form, a card, a nav, a dialog. This is the medium-specific complement to
[design-and-continuity.md](design-and-continuity.md)'s "UI layout
realism" checklist: that section checks a still is *structurally*
correct (stacking order, no overlap, hit targets); this doc covers *why*
a structurally-correct mockup can still fail once it's moving, compressed,
and only on screen for a couple of seconds.

The core problem video adds that a static screenshot doesn't have: **the
viewer can't pause, zoom, or re-read.** Everything the narration expects
them to notice must already be visually obvious in the moment it's on
screen.

## Do

- **Oversize relative to a real product.** A real app's UI is designed to
  be read at native size, close up, with the viewer in control of
  attention. In a video it's often smaller (embedded in a feed, on a
  phone, scaled down in an editor) and the viewer isn't in control of
  timing. Use bigger type, thicker strokes, and more generous padding
  than the real product actually has - a mockup, not a pixel-accurate
  clone.
- **Strip UI down to only what the scene needs.** Omit the sidebar, the
  unrelated toolbar icons, the nav the scene isn't about. Every element
  left on screen should earn its place per design-and-continuity.md's
  relevance rule - a mockup with 80% of a real app's chrome and one
  highlighted button buries the point in noise.
- **Make every state change an explicit visual signal.** A real product
  relies on hover states and subtle affordances a live user notices
  because they're driving the mouse. A video viewer isn't driving
  anything - pair every change with something unmissable: a colour shift,
  an icon swap, a checkmark, a highlight ring appearing. If it wouldn't
  read on a still frame, it won't read in motion either.
- **Use subtle camera zoom to focus action inside a full-page mock**,
  especially when reconstructing a real screen - ease in, hold through
  typing/clicking, ease out. Prefer light punch-ins (~1.12–1.35×) over
  aggressive crops. Full guidance:
  [camera-zoom-focus.md](camera-zoom-focus.md). Zoom emphasises; it does
  not replace an explicit state signal.
- **When explaining an existing page/feature, reconstruct it** as a
  finished Remotion screen with mock data (shared shell + props), not a
  live capture or screenshot pan - see
  [feature-walkthrough-reconstruction.md](feature-walkthrough-reconstruction.md).
- **Use one consistent cursor/pointer** (a shared component, see
  [reusable-components.md](reusable-components.md)) for any demonstrated
  interaction. Move it with intent - ease toward the target, brief pause
  before the "click," brief pause after - so the action registers rather
  than blurring past.
- **Type into fields one character at a time** (~35 cps default) with a
  blinking caret - copy [assets/typing.ts](../assets/typing.ts), never dump
  a whole email/word in one frame. See
  [natural-typing.md](natural-typing.md).
- **Keep in-mockup copy extremely short.** A label, a headline, a couple
  of words - never a paragraph a viewer would need to pause on. If the
  real product's copy is longer, that's a sign this beat should be told
  through narration + a short on-screen fragment, not a screenshot of the
  actual text.
- **Resolve loading/async states quickly and deliberately.** If a scene
  needs to show "loading," give it a short, purposeful beat (a spinner or
  skeleton for well under a second of screen time) that resolves into the
  end state - never an indefinite/looping loading state with nothing to
  cut away to.

## Don't

- **Don't replicate a dense real dashboard/table verbatim.** Rows of real
  data, multiple columns, small numbers - all unreadable at video pace,
  even if it's an accurate screenshot. Simplify to the 2-3 values the
  scene is actually about.
- **Don't rely on hover-only affordances, tooltips-on-demand, or
  icon-only buttons without a visible label.** There is no viewer cursor
  to trigger a hover in a rendered video - anything the narration
  references must already be visibly labelled/highlighted, not
  discoverable-on-interaction.
- **Don't move a cursor or transition faster than a person could
  plausibly follow.** A demo sped up for "punchiness" often undercuts
  comprehension and credibility at the same time - match the pace a real
  user would need to actually see the action happen.
- **Don't place light text on a busy image/photo without a legibility
  scrim.** If UI copy sits over a generated background or photo, add a
  solid/gradient overlay strong enough that contrast holds regardless of
  what's underneath.
- **Don't animate secondary UI chrome with the same weight as the thing
  being taught.** A nav bar sliding in with the same emphasis as the
  button the scene is about competes for attention it hasn't earned - see
  design-and-continuity.md's motion-restraint rule.
- **Don't zoom on every interaction or past ~1.35× for ordinary UI**
  without a reason - sparse, subtle, ease-in/hold/ease-out punch-ins only
  ([camera-zoom-focus.md](camera-zoom-focus.md)).
- **Don't invent interaction states the real product doesn't have** (a
  fake "success" toast, a made-up settings screen) just to fill a beat -
  if the real UI doesn't do it, either simplify the claim or ask the user
  for the accurate flow.
- **Don't paste a screenshot and pan across it** as a stand-in for
  reconstructing the page when the brief is a feature walkthrough -
  rebuild the UI in components
  ([feature-walkthrough-reconstruction.md](feature-walkthrough-reconstruction.md)).
- **Don't dump typed text in chunks or all at once** - one character per
  step ([natural-typing.md](natural-typing.md)).

## Self-audit

Fold this into the same Gate 6 still-check as
design-and-continuity.md - when the scene includes UI chrome, additionally
ask of each checked frame:

- Would this be legible at the size/embedding context this video will
  actually be watched in (not just at full-screen 1080p in the editor)?
- Does every state the narration mentions have a visible, obvious signal -
  or does it rely on a hover/tooltip the viewer can't trigger?
- Is any in-mockup text longer than a viewer could read in the time it's
  on screen?
- If camera zoom is used: is it subtle, eased, and aimed at the narrated
  control ([camera-zoom-focus.md](camera-zoom-focus.md))?
- If typing is used: does a mid-beat still show a partial string, one
  character at a time, with a caret ([natural-typing.md](natural-typing.md))?
- If this is a feature walkthrough: would a teammate recognise the page,
  and is mock data finished
  ([feature-walkthrough-reconstruction.md](feature-walkthrough-reconstruction.md))?
