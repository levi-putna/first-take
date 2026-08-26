# Poster / thumbnail generation (gpt-image-2)

The **poster** and the **thumbnail** are the same asset: the still that
sells the click before play (YouTube custom thumbnail, social cover,
HTML `poster`, OG preview). At Gate 7 every rendered format needs a
purpose-designed `poster.png` / `poster-{formatId}.png` - not a random
mid-video still.

Generate with **OpenAI `gpt-image-2`** via AI Gateway
(`AI_GATEWAY_IMAGE_MODEL`, default `openai/gpt-image-2`), one image per
approved format/platform style. A Remotion frame may inform colour/subject
only; it is not the shippable thumbnail when AI Gateway is available.

> **Call mechanics** (auth, sizes, quality tiers):
> [video-image-generation.md](video-image-generation.md).
> **This file** decides *what the thumbnail includes and how to lay it out*.
> **Gate 4 `theme.ts` / brand** only supplies *styling* (palette, mood,
> type feel) - it does not redefine the layout recipe.

Reference layouts (study these before prompting):

| File | What to steal |
|------|----------------|
| [assets/poster-examples/layout-templates-split.png](../assets/poster-examples/layout-templates-split.png) | Split canvas: text zone + visual zone, diagonal colour blocks, badges, high-contrast palettes |
| [assets/poster-examples/icon-plus-text.png](../assets/poster-examples/icon-plus-text.png) | Faceless pattern: oversized thematic icon + hero headline (no people) |
| [assets/poster-examples/explainer-process-diagram.png](../assets/poster-examples/explainer-process-diagram.png) | Explainer pattern: huge question/headline + simple process cue (problem → process → solution) |
| [assets/poster-examples/ui-explainer-text-led.png](../assets/poster-examples/ui-explainer-text-led.png) | UI/product pattern: two-tone hero title + simplified device mock + short callouts |

## Roles: this guide vs theme/branding

| Source | Controls |
|--------|----------|
| **This reference** | What appears on the poster, layout recipe, hierarchy, safe zones, faceless visual anchors, prompt structure |
| **`brief.md` + script hook** | Topic sentence → compressed into the hero headline |
| **`theme.ts` / brand** | Colours, accent, mood, type personality (translate into prompt styling - not a new composition) |

Do **not** invent a new layout because the brand is "minimal" or "playful".
Pick a recipe below, then **skin it** with the production theme.

## When this runs

- **Gate 7, after** each format's `final.mp4` / `final-{formatId}.mp4`.
- **Requires** `AI_GATEWAY_API_KEY`. If missing, fall back to
  `npx remotion still` from the strongest moment and say so at Gate 8 -
  prefer compositing real hero type over a still that has none.
- Generate **once per format**. Regenerate only if Gate 8/user rejects the
  thumbnail or the hook/theme/format changed.

## YouTube thumbnail rules (baseline for every channel)

Distilled from current thumbnail practice (mobile-first CTR packaging).
Apply these even when the destination is a website poster or social cover -
YouTube is the strictest readability bar.

| Rule | Do | Don't |
|------|-----|--------|
| **One idea** | One promise the viewer can decode in ~0.5s | Summarise the whole video |
| **Hero text** | 2-4 words (cap ~5), huge bold sans, all-caps OK; **no em dashes (—)** | Tiny captions, sentences, title pasted verbatim, em dashes |
| **Reads tiny** | Legible when shrunk to ~120–168px wide | Detail that only works at full canvas |
| **Contrast** | Strong luminance + hue contrast vs light *and* dark YouTube chrome | Low-contrast greys that vanish in the feed |
| **Safe zone** | Keep headline + visual anchor in the centre / left ~70% | Critical content in the **bottom-right** (duration badge) |
| **Separation** | Outline, shadow, or colour slab behind type | Thin hairline type on busy photo |
| **Curiosity** | Thumbnail + video title work as a pair (thumb adds angle/proof; title carries SEO) | Repeat the full title on the image |
| **People** | **Never** for this skill - use a faceless visual anchor instead | Stock presenters, AI faces, pointing humans |

Specs when shipping a YouTube custom thumbnail: design at gpt-image-2 sizes
such as `1536x1024` / `1920x1088`, deliver toward **1280×720**, under ~2 MB
PNG/JPG.

## Hard rule: no people

These productions are UI/product explainers. **Do not put a person, face,
influencer, or mascot character in the thumbnail** - even if lifestyle
template packs show faces in the visual zone.

### What replaces the person (visual anchor)

Pick **one** primary anchor that fills the role a face would play (attention
+ emotion + topic cue):

| Anchor | Best when | Notes |
|--------|-----------|--------|
| **Oversized thematic icon** | Concept is clear as a symbol (mic, chart, toggle, lock, cursor) | Sticker/outline treatment so it pops - see `icon-plus-text.png` |
| **Simplified UI / device mock** | Feature or page walkthrough | Abstract chrome only - not a dense readable screenshot - see `ui-explainer-text-led.png` |
| **Before / after split** | Contrast or "wrong vs right" brief | One variable labelled; text still hero |
| **Big number / metric** | Data or outcome is the hook | The number can *be* the headline ("−40%") |
| **Mini process row** | How-it-works explainers | 2–3 icon steps max (problem → process → solution) - see `explainer-process-diagram.png` |
| **Product / object close-up** | Physical or branded object | Single subject, high contrast, no clutter |

If you need directional attention (templates often use a person pointing),
use **arrows, callout boxes, or glow** aimed at the proof graphic - never a
human pointer.

## What every thumbnail must include

Build from this inventory - then stop. More elements = weaker CTR.

### Required

1. **Hero headline (2–4 words)** - names the topic; largest element;
   highest contrast; centre/left safe zone.
2. **One visual anchor** - from the table above; secondary to the text;
   illustrates the headline.
3. **Theme-skinned background** - solid, soft gradient, or light geometric
   pattern using `theme.ts` colours - calm enough that type wins.

### Optional (at most two)

- **Eyebrow / part label** - tiny ("PART 2", "RULE 3", brand wordmark).
- **One badge or CTA chip** - short ("WATCH", "NEW", a chapter tag) - never
  longer than the hero line.
- **One accent flourish** - brush swoosh, diagonal slash, soft glow behind
  the anchor - creative flare, not a second subject.
- **1–3 micro callouts** - only for dense UI explainers; short labels, not
  paragraphs (`ui-explainer-text-led.png`).

### Never

- People / faces / stock "surprised creator"
- Em dashes (—) in any on-image text, badges, callouts, or prompts - use a
  spaced hyphen (` - `), comma, or full stop (skill-wide hard rule)
- Full dense app screenshots as the hero
- Watermarks, fake YouTube UI chrome, subscribe bells
- More than one competing focal graphic
- Text-free mood-only abstracts
- Repeating the full video title word-for-word when a shorter angle works

## Layout recipes (pick one, then theme-skin it)

Default to a **split layout**: text zone + visual-anchor zone. That is the
pattern across the reference examples and most high-CTR faceless thumbs.

### Recipe A - Split text + icon (default faceless)

Inspired by `layout-templates-split.png` + `icon-plus-text.png`.

```
┌──────────────────────────────┐
│  HERO TEXT          [ICON]   │
│  (left ~55%)        (right)  │
│  optional eyebrow            │
│           optional badge     │
└──────────────────────────────┘
```

- Diagonal or block colour split is fine (black/orange, white/photo zone,
  yellow field, etc.) - **recolour with theme tokens**.
- Icon gets sticker outline / thick border so it reads at stamp size.
- Best for concept explainers, feature names, series episodes.

### Recipe B - Two-tone title + UI proof

Inspired by `ui-explainer-text-led.png`.

```
┌──────────────────────────────┐
│ BRAND · optional             │
│ HERO LINE 1 (white)          │
│ HERO LINE 2 (accent)   [UI]  │
│ short sub (optional)   call- │
│                      outs x3 │
│ footer icon row (optional)   │
└──────────────────────────────┘
```

- Hero title can break across two lines with **theme accent on the key
  word(s)** ("UI BEST" / "**PRACTICES**").
- Device mock is simplified shapes - not real dense UI.
- Cap callouts at three; each is icon + 2–4 words.
- Best for UI/UX, best-practices, multi-tip teasers.

### Recipe C - Question headline + process cue

Inspired by `explainer-process-diagram.png` (drop the person).

```
┌──────────────────────────────┐
│ HOW DOES                     │
│ IT WORK?  (accent on key)    │
│ [sub banner]                 │
│ ● Problem → ● Process → ● Solution │
│              [optional icon] │
└──────────────────────────────┘
```

- Headline can be a short question or promise.
- Process row is optional support - keep icons huge and labels tiny.
- Replace any human with a thematic icon or empty negative space + glow.
- Best for "how it works", pipeline, onboarding explainers.

### Recipe D - Billboards number / before-after

```
┌──────────────────────────────┐
│  −40%          │  after UI   │
│  DROP-OFF      │  (clean)    │
│  (hero)        │─────────────│
│                │  before UI  │
│                │  (muted)    │
└──────────────────────────────┘
```

- Number or contrast claim is the hero text.
- Split proof graphic supports the claim.
- Best for metrics, A/B, wrong-vs-right briefs
  ([content-formula.md](content-formula.md)).

### Vertical / square adaptations

Same recipes; stack instead of side-by-side when the format is 9:16 or 1:1:

- **Hero text in the centre band** (survives profile-grid crop).
- Visual anchor above or below the type - still smaller than the headline.
- Clear top/bottom unsafe zones for Reels/TikTok/Shorts UI overlays
  ([multi-format-layout.md](multi-format-layout.md)).

## Styling with the production theme

`theme.ts` answers "how should it look?", not "what goes where?":

1. Map **background / surface / accent** into the chosen recipe's colour
   blocks (e.g. dark field + accent diagonal + white type).
2. Put the **accent on the hero text** (or the key word) and on one support
   graphic - not on everything.
3. Match **mood** (calm product vs punchy social) in type weight and flare -
   same recipe, different energy.
4. Keep a **2–3 colour** thumbnail palette derived from theme (plus
   black/white). More colours dilute contrast at mobile size.
5. Creative flare (glow, slash, brush, geometric dots) stays within theme
   colours and **never** outranks the headline.

## Channel sizes & safe zones

Generate **one thumbnail per approved format**.

### YouTube long-form (16:9)

| Spec | Guidance |
|------|----------|
| Size | `1536x1024` or `1920x1088` → deliver ~1280×720 |
| Layout | Recipe A–D landscape split |
| Safe | Centre/left ~70%; **empty bottom-right** for duration badge |
| Text | 2–4 words hero |

### Shorts / Reels / TikTok / Stories (9:16)

| Spec | Guidance |
|------|----------|
| Size | `1024x1536` class |
| Layout | Stacked recipe; hero text in **centre** band for 1:1 / 4:5 grid crop |
| Safe | Avoid top ~200px, bottom ~340px, right ~120px when used as in-app cover |
| Text | 2–4 words, even larger relative to frame |

### Feed (1:1 / 4:5)

| Spec | Guidance |
|------|----------|
| Size | `1024x1024` or ~`1080x1350` |
| Layout | Centred hero text + one anchor; prefer 4:5 when the platform allows |
| Safe | Keep headline away from rounded-corner crop |

### Website / landing `poster`

| Spec | Guidance |
|------|----------|
| Size | Match video aspect (usually 16:9) |
| Layout | Same recipes, slightly calmer flare if the page already has an H1 |
| Text | Still required - short hook that complements page copy, doesn't clone it |

## Prompting gpt-image-2

Write an art-direction brief. Lock **headline → recipe → visual anchor →
theme skin** before calling the model.

### Prompt skeleton

```text
YouTube-style video thumbnail / poster, {aspect}, mobile-first, must read
clearly at postage-stamp size.
NO PEOPLE, no faces, no human figures, no mascots.

LAYOUT RECIPE: {A split text+icon | B two-tone title+UI | C question+process | D number/before-after}.
TEXT IS THE HERO: largest element, bold heavy sans-serif, high contrast,
centre/left safe zone, empty bottom-right for duration badge.
Hero headline (exact): "{2-4 WORDS}".
Optional eyebrow: "{short}".
This video is about: {one plain sentence}.

Visual anchor (secondary only): {one oversized icon OR simplified device mock
OR before/after OR big number support} with sticker/outline pop - never
busier or larger than the headline.
Background: {solid/soft gradient/light geometry from theme}.
Theme styling: {palette + mood from theme.ts}; accent colour on the
headline key word and one support graphic.
Creative flare: {one diagonal slash / glow / brush / badge} within theme
colours.
Avoid: people, watermarks, fake platform UI, dense screenshots, tiny text,
clutter, text-free mood images, repeating a long video title, em dashes
(the character —) in any text - use a spaced hyphen or comma instead.
```

### Text strategy

- **Default:** put the exact hero line in the prompt and state it is the
  largest element.
- **No em dashes (—)** in hero text, eyebrows, badges, callouts, or the
  prompt's quoted copy - rewrite with a spaced hyphen (` - `), comma, or
  full stop before generating (skill-wide hard rule).
- **If type is garbled or brand font must be exact:** generate the
  layout/anchor text-free, then composite the real headline as the dominant
  layer (Remotion `Poster` or design tool). Never ship without hero text.
- Prefer fewer, bigger words over a clever longer line.

### Generation call

```ts
import { experimental_generateImage as generateImage } from "ai";
import { writeFileSync } from "fs";

const model = process.env.AI_GATEWAY_IMAGE_MODEL ?? "openai/gpt-image-2";

const result = await generateImage({
  model,
  prompt: posterPrompt,
  size: posterSize, // "1536x1024" | "1024x1536" | "1024x1024"
  providerOptions: {
    openai: {
      quality: "high",
      background: "opaque",
    },
  },
});

writeFileSync(
  `public/video/${slug}/poster-${formatId}.png`,
  Buffer.from(result.image.base64, "base64"),
);
```

- Use `high` quality for thumbnails (hero asset). One regenerate max if
  text/layout misses; then simplify or composite type.

## Self-check before presenting (Gate 7 → 8)

- [ ] Treats poster and thumbnail as the same job (click packaging)
- [ ] Follows a named layout recipe from this guide (not an ad-hoc collage)
- [ ] Theme/brand used only as styling - recipe still readable
- [ ] **No people / faces**
- [ ] Hero text is the first thing you notice (2-4 words, legible when shrunk)
- [ ] No em dashes (—) in any on-image text
- [ ] One visual anchor supports the headline; nothing competes with it
- [ ] Topic matches `brief.md`; curiosity pairs with the video title
- [ ] Bottom-right clear (16:9); vertical centre-safe for 9:16 grid crops
- [ ] One file per approved format
- [ ] Not a Remotion freeze-frame unless AI Gateway unavailable

## Relationship to other references

- Call setup / sizes / quality:
  [video-image-generation.md](video-image-generation.md)
- Video safe zones (in-timeline, not thumbnail):
  [multi-format-layout.md](multi-format-layout.md)
- Export expectations:
  [production-quality-guidelines.md](production-quality-guidelines.md)
- Contrast content shape (feeds Recipe D):
  [content-formula.md](content-formula.md)
- Theme continuity in the video itself:
  [design-and-continuity.md](design-and-continuity.md)
