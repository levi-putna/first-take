# Reusable components across productions

Consistency across Jumbo AI training videos comes from **one shared kit**:
`remotion/shared/`. Every production extends its theme and prefers its
components before inventing local chrome.

`productions/{slug}/shared/` is only for visuals that are truly unique to
that one video (a one-off diagram, a selective-fade effect used nowhere
else yet).

## Source of truth: the kit catalog

**Before Gate 3 scene planning and Gate 4 component work, read:**

- [`remotion/shared/catalog.ts`](../../../remotion/shared/catalog.ts) -
  machine-readable `kitCatalog` (jobs, when-not-to-use, props, notes)
- [`remotion/shared/theme.ts`](../../../remotion/shared/theme.ts) - base
  brand tokens (seeded from `DESIGN.md`)
- [`remotion/shared/fonts.ts`](../../../remotion/shared/fonts.ts) - Poppins /
  Roboto / IBM Plex Mono
- [`remotion/shared/index.ts`](../../../remotion/shared/index.ts) - barrel
  exports

Studio previews for every kit entry are registered in `remotion/Root.tsx`
as `kit-*` compositions - open Remotion Studio and skim them when unsure
which plate fits a beat.

**Hard preference order**

1. **Use a kit component** from `remotion/shared/` (add a prop if needed)
2. **Compose kit pieces** (e.g. `Background` + `ChapterPill` + copy)
3. **Production `shared/`** only when no kit entry's `jobs` match
4. **Promote** to `remotion/shared/` once a second production needs it
5. **Never fork** a kit file into a production copy "just this once"

If you write a near-duplicate of `CompareRow`, `TermCard`, `Intro`,
`TopicsList`, etc. in a production folder, that is a skill failure - fix by
switching to the kit (or extending it with a prop).

## Two tiers of `shared/`

```
remotion/
  shared/                          # SERIES KIT - consistency across all videos
    catalog.ts                     # kitCatalog index - check this first
    theme.ts                       # base brand tokens
    fonts.ts
    Background.tsx                 # navy | light | gradient
    TrainingIntro.tsx              # ~2s series bumper / jingle lead-in visual
    Intro.tsx / Outro.tsx          # module title / takeaway close
    SectionTitle.tsx / TopicsList.tsx / TermCard.tsx / CompareRow.tsx
    Callout.tsx / ChapterPill.tsx / CaptionBar.tsx / ProgressDots.tsx
    AnimatedJoe.tsx / AnimatedJumboLogo.tsx
    infographics/                  # AI concept pictograms + InfographicExplain
    seriesAudio.ts                 # jingle/bed paths + lead-in (Gate 4)
  productions/{slug}/
    shared/
      theme.ts                     # MUST import & extend remotion/shared/theme.ts
      {OnlyIfNotInKit}.tsx         # production-unique visuals only
```

- **`remotion/shared/`** - the house design system for video. Same look
  across Foundations (and later training series).
- **`productions/{slug}/shared/`** - episode-specific motion graphics that
  are not (yet) kit material.

## Jumbo kit inventory (what to reach for)

| Kit id | Use when the beat is… | Don't use when… |
|--------|------------------------|-----------------|
| `TrainingIntro` | Series bumper / jingle lead-in pre-roll | Module title card (use `Intro`) |
| `Intro` | Course + module title card | Long teaching body |
| `Outro` | Takeaway + next-up / quiz cue | Mid-video checkpoint (`SectionTitle`) |
| `SectionTitle` | Chapter / section open | Term definition (`TermCard`) |
| `TopicsList` | Numbered list, TOC, checklist | Dense paragraphs or >~6 items |
| `TermCard` | One term + one-line definition | Multi-term dumps |
| `CompareRow` | Myth/fact, do/don't, two-sided contrast | More than two sides |
| `Callout` | Scarce tip / warning emphasis | Default content container every scene |
| `Background` | Full-bleed continuity canvas | Duplicated per scene behind the same look |
| `ChapterPill` | Module/section chip | Pill on every box |
| `CaptionBar` | Burned-in / lower-third captions | Covering the focal visual |
| `ProgressDots` | n of m series progress | First viewport already crowded |
| `AnimatedJoe` | Living brand mark in lockups | Static `JumboMark` icon as the hero |
| `InfographicExplain` / icons | Concept metaphor + short definition | Dense multi-step process (split scenes) |

Episode-only examples that **belong in production `shared/`** until a second
video needs them: selective word fade, nod-row metaphor, nested-ring diagram
unique to one lesson, typed jargon wall, module-map tied to course config.

## Theme extension, not duplication

A production's `theme.ts` **must import and extend**
`remotion/shared/theme.ts` - never redefine the Jumbo palette/type from
scratch:

```ts
// productions/{slug}/shared/theme.ts
import {
  colors as baseColors,
  motion as baseMotion,
  spacing as baseSpacing,
  typography as baseTypography,
  // …elevation, formats, rounded, springConfigs as needed
} from "../../../shared/theme";

export const colors = {
  ...baseColors,
  // production-only extras only
} as const;

export const motion = { ...baseMotion };
export const spacing = { ...baseSpacing };
export const typography = { ...baseTypography };
```

Scenes import tokens from the **production** `theme.ts` (so extras resolve)
or from kit components that already bind to base tokens. **Never hardcode
hex values or font family strings in a scene file.**

Prefer kit `Background` with `variant="navy" | "light" | "gradient"` over a
one-off production background unless the brief needs a unique treatment.

## Using the kit (Gate 3 + Gate 4)

### Gate 3 - scene plan

For every `component` scene, note in `visualNotes` (or a
`kitComponents: string[]` field) which kit entries will be used. Prefer
mapping:

- Title / bumper → `TrainingIntro` + `Intro`
- Two-sided contrast → `CompareRow` (before inventing another two-column)
- Term landing → `TermCard`
- List of topics / modules as a simple list → `TopicsList` (a richer
  ModuleMap may still be production-specific if it needs reorder/quiz
  blocks)
- Warning / tip → `Callout`
- Concept pictogram → `InfographicExplain` / `InfographicIcon`

Present a short **kit vs production** split when showing the scene table.

### Gate 4 - build

1. Open `kitCatalog` and list every entry this production will import.
2. Extend `theme.ts` from the kit; create production components only for
   gaps.
3. If a production component is a thin wrapper around a kit entry (e.g.
   `TitleCard` → `Intro`), say so in the Gate 4 presentation.
4. Series audio config lives in `remotion/shared/seriesAudio.ts` (see
   [shared-audio-bed.md](shared-audio-bed.md)).

## Promoting a component to the shared library

Only promote when there's a **real, current** second production that
needs it - not speculatively. When that happens:

1. Move the file from `productions/{slug}/shared/` to `remotion/shared/`
   (or `remotion/shared/charts/` / `infographics/` as appropriate).
2. Generalise: props instead of hard-coded episode copy. Add a
   `kitCatalog` entry in `catalog.ts` and a `kit-*` preview in `Root.tsx`.
3. Update the original production to import from the kit.
4. Note the promotion in that gate's presentation.

**Never fork a shared component per-production** - add a prop instead.

## Prime shared-library candidates

Already in the Jumbo kit (do not rebuild): intros, outros, term cards,
compare rows, topics lists, backgrounds, Jo, infographics, captions.

Still worth promoting when a second video needs them:

- **Series audio** helpers (`seriesAudio.ts` + mix utilities)
- **Chart/graph primitives** - see [data-visualization.md](data-visualization.md)
- **Camera focus / punch-in helper** - see [camera-zoom-focus.md](camera-zoom-focus.md)
- **Natural typing helper** - promote `typing.ts` once a second production
  needs it - see [natural-typing.md](natural-typing.md)
- Episode motion graphics that recur (e.g. `NestedRings` once 1.2 lands)

Everything else stays production-local until a second video actually needs it.
