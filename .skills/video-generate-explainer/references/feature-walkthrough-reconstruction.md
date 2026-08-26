# Feature / page walkthrough reconstruction

When the user asks for a video that **explains an existing page, screen,
or feature of the app**, do **not** reach for a real screen recording as
the primary visual. This skill's job is the opposite: **rebuild the
screen in Remotion** from pure components + believable mock data so the
result looks like a finished product UI - close to a Screen Studio-style
recording in polish, but fully code-driven, narratable, and zoomable.

Pair with [camera-zoom-focus.md](camera-zoom-focus.md) for punch-ins while
stepping through the flow, and with
[ui-ux-video-guidelines.md](ui-ux-video-guidelines.md) for legibility
rules. Reconstruction answers "make it look like *our* app"; zoom answers
"make the viewer look *here* right now."

## When this mode applies

Trigger (confirm at Gate 1) if any of these are true:

- The ask names a real route, page, or feature ("explain the billing
  settings page", "walk through creating a project", "show how filters
  work on /dashboard").
- The user wants something that "looks like a screen recording" of the
  product but is still an explainer/teaser under this skill.
- The narration only makes sense if the viewer recognises the actual UI
  structure (nav, layout, field order) rather than a generic mock.

**Out of scope for this doc:** abstract motion-graphics explainers, pure
metaphor scenes, or teasers that intentionally stylise away from the real
UI. Those stay on the normal Gate 4 mockup path (simplified chrome is
fine).

If the user actually needs a literal capture of the live app (bugs,
exact pixel QA, unscripted exploration), say so: that is a different
problem (Screen Studio / OBS / etc.) and this skill should not pretend to
replace it. Offer reconstruction when the goal is a **controlled,
narrated, on-brand explainer**.

## Goal of reconstruction

The finished scene should read as:

1. **A completed screen** - not a collage of floating widgets. Same
   information architecture as the real page (header, nav, primary
   column, relevant secondary chrome).
2. **Product-faithful, not pixel-perfect.** Match layout rhythm, control
   types, copy hierarchy, and brand tokens. You may oversize type/spacing
   slightly for video legibility (ui-ux-video-guidelines.md) without
   inventing a different product.
3. **Driven by mock data** - realistic names, amounts, dates, avatars -
   so empty states and "lorem" never appear unless emptiness is the
   teaching point.
4. **Interactive on a timeline** - cursor, typing, clicks, and state
   changes are authored in Remotion, then emphasised with subtle camera
   focus (camera-zoom-focus.md).

## Gate 1 - Flag the mode in the brief

When this mode applies, record in `brief.md`:

```md
## Production mode
feature-walkthrough

## Source UI
- Route / screen: `/settings/billing`
- Feature under explanation: updating the payment email + saving
- Reference: [link, screenshot path, or "inspect live app in repo"]
```

Also confirm:

- **Fidelity bar** - "recognisably our billing page" (default) vs
  "simplified teaching mock that only keeps the form". Default to
  recognisable reconstruction for feature explainers.
- **Which flow beats matter** - the video explains a path through the
  page, not every control on it.
- **Access** - can you inspect the real page in the repo / running app /
  design file? If not, ask for a screenshot or URL before Gate 3.

## Gate 2 / 3 - Script and scene plan around real steps

Write the VO as a walkthrough of **user-visible actions**, not
implementation details (no component names, routes as jargon, or prop
lists spoken aloud - see audio-first-script.md).

At Gate 3, prefer **one continuous reconstructed surface** across several
scenes (same shared page shell, different focus/state) over reinventing a
new abstract layout per beat. Example scene split:

| id | keyPoint | visualNotes (sketch) |
|---|---|---|
| 01 | Where billing lives | Full page shell, wide shot, cursor idle near Settings nav |
| 02 | Edit the email | Same shell; focusSubtle zoom on email input; type mock address |
| 03 | Save confirms | Reframe to Save; click; explicit success state |

Put shared shell work in Gate 4 (`shared/BillingSettingsScreen.tsx`), not
duplicated per scene file. List zoom targets in `visualNotes` per
[camera-zoom-focus.md](camera-zoom-focus.md).

Prefer `visualType: "component"` for the entire walkthrough. Do **not**
propose `real-video` of the live app as the explanatory body - that
defeats reconstruction. `real-video` remains only for brief approved
intro/outro stings.

## Reconstructing from the real app (Gate 4 prep)

Work in this order:

### 1. Inspect the source

Prefer, in order:

1. The actual React/Vue/etc. page and its design-system components in the
   repo.
2. A current screenshot or staging URL the user provides.
3. A design file - only if code/screenshot aren't available.

Extract a short **UI inventory** before coding (keep it in
`visualNotes` or a comment at the top of the shared screen component):

- Layout regions (app shell, page header, main, side panel…)
- Controls involved in the explained flow (and only those that must
  remain for recognisability)
- Key copy (headings, labels, primary button labels)
- States needed on the timeline (default, focused, filled, error,
  loading, success)
- Brand tokens already in the project (colour, radius, type) - wire
  `theme.ts` to them per Gate 4 rather than inventing a parallel palette

### 2. Rebuild as Remotion-pure UI

- **Compose from simple Remotion-friendly primitives** (`div`/`svg`,
  project tokens, maybe thin shared buttons/inputs under
  `productions/{slug}/shared/` or `remotion/shared/`).
- **Do not import the live Next.js page tree into Remotion** if it pulls
  routers, data loaders, providers, or browser-only APIs - those break
  deterministic rendering. Re-declare the visual structure; reuse tokens
  and icon components when they're safe/pure.
- **Strip only what the walkthrough doesn't need** for recognition -
  unread notification badges, unrelated table columns, secondary nav
  items can go. Keep enough chrome that a teammate would say "that's the
  billing page."
- **One shell component** owns the page frame; scenes pass props like
  `emailValue`, `saveState`, `highlight`, rather than forking the layout.

### 3. Mock data that looks finished

- Use coherent fake entities (one company, one user, consistent currency
  and dates).
- Prefer short labels that stay readable at video size; if real copy is a
  paragraph, keep the real heading/label and shorten helper text.
- Never leave "Title", "Button", or grey empty cards in the final frames
  unless teaching an empty state.
- If the real page shows charts or dense tables, simplify to the 2–3
  values the narration names ([data-visualization.md](data-visualization.md),
  ui-ux-video-guidelines.md) while keeping the surrounding page shell.

### 4. Interaction layer

Add shared pieces once:

- `Cursor` (project or production `shared/`)
- Optional keystroke captions only if the audience is technical and the
  brief wants them
- `CameraFocus` / focus beats per camera-zoom-focus.md
- Shared typing helper from [assets/typing.ts](../assets/typing.ts) /
  [natural-typing.md](natural-typing.md) - `typedText` at ~35 cps (or
  `typedTextOverDuration`) whenever a field is filled on the timeline
- Explicit state visuals for every narrated change (focus rings, pressed
  buttons, toasts, checkmarks) - zoom is emphasis, not the state signal

## Fidelity vs teaching - the balance

| Situation | Bias |
|---|---|
| Brand/marketing feature teaser on a known screen | Higher fidelity shell; subtle zoom; slightly oversized type OK |
| Onboarding / tutorial of a dense enterprise page | Keep IA recognisable; aggressively hide unrelated denser regions; zoom more |
| Explaining one tiny control | Still mount it inside a recognisable page region, then `focusDetail` - don't show a lone orphaned widget unless Gate 1 agreed "component only" |
| Before/after of a UX fix | Same shell both sides; change only the variable under explanation ([content-formula.md](content-formula.md)) |

If fidelity and legibility fight, **legibility wins for the focal
control**, fidelity wins for the **surrounding chrome**. That usually
means: real layout + camera zoom + slightly larger focal type - not a
redesigned page.

## Gate 6 self-audit (reconstruction)

In addition to design-and-continuity.md and ui-ux-video-guidelines.md:

- [ ] Would a teammate who knows the product recognise the page in the
      opening wide shot within ~1 second?
- [ ] Is every narrated step visible as a real control state change (not
      only described in VO)?
- [ ] Does mock data look like a finished environment?
- [ ] Are zoom beats sparse, subtle, and tied to typing/clicking
      (camera-zoom-focus.md)?
- [ ] If typing: one character at a time with caret, mid-still shows a
      partial value (natural-typing.md)?
- [ ] Did you avoid importing live app runtime (router/data/providers)
      into the Remotion tree?
- [ ] Across scenes, is it clearly the **same** shell (shared component)
      rather than a redrawn cousin?

## Critic (Gate 8) extras for this mode

Under **UI & animation clarity**, also fail if:

- The walkthrough looks like generic UI kits unrelated to the product.
- Steps skip a necessary intermediate state the real flow has (e.g.
  saving with no pending/success).
- Camera zooms are so aggressive or frequent the page identity is lost.
- A "screen recording" was faked by pasting a static screenshot and
  panning across it without rebuild - screenshots are reference only,
  not the scene implementation (unless Gate 3 explicitly approved a
  still-image support asset under the background/image rules).

## Don't

- Don't substitute a real capture for reconstruction when the user asked
  for an explainer under this skill.
- Don't rebuild the entire application - only the screen(s) and states
  the script needs.
- Don't invent flows, labels, or success states the product doesn't have
  (ui-ux-video-guidelines.md).
- Don't fork a near-copy of the page into every scene file - one shared
  screen, props for state.
- Don't rely on a zoom alone to "fix" a messy reconstruction; fix the
  layout first, then aim the camera.
