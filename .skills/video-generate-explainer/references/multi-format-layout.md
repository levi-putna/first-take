# Responsive layout across aspect ratios

Guidance for when a production targets more than one format (Gate 1) - how
to make **one set of shared components** actually read correctly in
16:9, 1:1/4:5, and 9:16, plus the platform-specific safe zones a finished
9:16 export has to dodge once it's uploaded somewhere with native UI on
top of it (TikTok, Reels, Shorts, Stories). This is the layout-adaptation
complement to [ui-ux-video-guidelines.md](ui-ux-video-guidelines.md)
(legibility/state-signals) and
[design-and-continuity.md](design-and-continuity.md) (structural
continuity) - read this one specifically for the "does this component
survive a completely different frame shape" problem.

## This skill's version of the problem is layout, not cropping

Most general video advice about multi-aspect delivery assumes a filmed
master that gets **cropped** per platform ("shoot wide, protect the
center, cut derivatives") - see e.g.
[moonb.io's format guide](https://www.moonb.io/blog/best-video-formats) and
[digitalsamba's aspect-ratio cheat sheet](https://www.digitalsamba.com/blog/video-aspect-ratio).
That doesn't apply here: per the main `SKILL.md` rule #4, every format
renders from **the same component**, reading real dimensions from
`useVideoConfig()` - there is no single master frame being cropped, each
format gets its own layout pass at render time. The risk isn't losing
content off the edge of a crop; it's a component whose hardcoded
pixel positions or fixed flex direction only happens to look right in the
format it was eyeballed in.

## The three format families

| Family | Typical size | Orientation | Destination | Notes |
|---|---|---|---|---|
| **16:9** | 1920×1080 | Landscape | YouTube, website hero/embed, desktop, decks | Widest canvas - most room for side-by-side layouts and longer text lines. |
| **1:1 / 4:5** | 1080×1080 / 1080×1350 | Square / tall-square | Feed posts (Instagram/Facebook/LinkedIn feed, not Stories/Reels) | 4:5 is the tallest a feed will show before cropping the post itself - prefer it over 1:1 when the platform allows, per [influencerdb's 2026 format guide](https://influencerdb.net/social-media-platform-playbooks/video-formats-for-social-media/). Composition should read with the focal point centred - feeds sometimes crop a square thumbnail into a circle/rounded-square preview. |
| **9:16** | 1080×1920 | Portrait | TikTok, Instagram/Facebook Reels, YouTube Shorts, Stories | Full-bleed mobile - the format most likely to have platform UI (captions, like/share rail, username) burned over the top after upload. See safe zones below. |

Confirm which of these the brief actually needs at Gate 1 - don't build
for all three by default (see main `SKILL.md`, Gate 1).

## Layout adaptation techniques

### 1. Branch on orientation, not on a specific resolution

Add a small helper (production `shared/` first; promote to
`remotion/shared/` once a second production wants it, per
[reusable-components.md](reusable-components.md)):

```ts
// shared/useFormatInfo.ts
import { useVideoConfig } from "remotion";

export function useFormatInfo() {
  const { width, height } = useVideoConfig();
  const aspect = width / height;
  return {
    width,
    height,
    orientation:
      aspect > 1.15 ? "landscape" : aspect < 0.87 ? "portrait" : "square",
  } as const;
}
```

Branch layout on `orientation`, not on `width === 1920` or similar - a
future format (e.g. a 4:5 feed variant added later, per the Revisions table
in the main `SKILL.md`) should fall into the right bucket automatically
instead of needing a new hardcoded check.

### 2. Proportional sizing, not fixed pixel values

A hardcoded `fontSize: 64` or `top: 400` was tuned for one canvas size and
will read tiny on a 1080-wide portrait frame or oversized on a 1080-tall
square one. Derive sizes from the frame itself, clamped to a sane range:

```tsx
const { width, height } = useVideoConfig();
const fontSize = Math.min(Math.max(width * 0.045, 32), 96);
const margin = Math.round(Math.min(width, height) * 0.06);
```

Using `Math.min(width, height)` for spacing/margins (rather than width or
height alone) keeps the number sane across a wide landscape frame *and* a
tall portrait one without a separate branch.

### 3. Reflow the arrangement, not just the sizes

The same scene idea often needs a genuinely different arrangement per
orientation, not just scaled-down copies of one layout - a landscape
side-by-side comparison has no room to breathe at 1080px width:

```tsx
const { orientation } = useFormatInfo();

<div
  style={{
    display: "flex",
    flexDirection: orientation === "landscape" ? "row" : "column",
    gap: margin,
  }}
>
  <Variant label="Too fast" />
  <Variant label="Perfect" />
</div>;
```

This is the same instinct as
[content-formula.md](content-formula.md)'s default-to-stacked guidance for
9:16 comparisons - a layout wrapper that switches `flexDirection` on
orientation is the concrete implementation of that rule, reused by every
scene that shows a multi-variant comparison instead of each one
reinventing the switch.

### 4. When a component genuinely can't adapt, say so at Gate 4

A wide horizontal browser-chrome mockup, a desktop-only multi-column table,
or a landscape establishing shot may have no sane portrait equivalent. Per
the main `SKILL.md`'s Gate 4 step 5: flag this explicitly and agree a
per-format variant of *that one component* with the user rather than
letting it silently clip, squash, or float in dead space.

## Platform safe zones (9:16 delivery)

Once a 9:16 export is uploaded to TikTok, Reels, or Shorts, the platform
draws its own UI **on top of the video** - captions/username on the
bottom-left, a like/comment/share rail down the right edge, and a
following/profile bar across the top. This is separate from anything this
skill renders (e.g. `@remotion/captions`, per
[elevenlabs-narration-sync.md](elevenlabs-narration-sync.md)) - it's the
host app's own chrome, and it will sit over whatever's in those regions
regardless of what the video contains. Keep on-screen text, logos, faces,
and CTAs out of these bands for any 9:16 export likely to be posted
natively to one of these apps (fractions of a 1080×1920 frame, so they
scale to any 9:16 resolution):

| Zone | Approx. band | Why |
|---|---|---|
| Top | Top ~11% of height | Username/sound label, following/for-you tabs |
| Bottom | Bottom ~20-25% of height | Caption text, CTA/description, sound attribution |
| Right edge | Right ~10% of width | Like/comment/share/bookmark icon rail |
| Left edge | Left ~5% of width | Smaller margin, but still avoid pinning text flush to the edge |

Net effect: keep the primary content of a 9:16 scene inside roughly the
**centre 65-70% height band** and **centre ~85% width band** of the frame.
(Sources: [TikTok/Reels/Shorts safe-zone breakdowns](https://wildandfreetools.com/blog/vertical-video-safe-zones-guide-2026/),
[postplanify's 2026 safe-zone guide](https://postplanify.com/blog/social-media-safe-zones-2026-complete-guide) -
exact pixel counts vary slightly per app/account type, so treat these as a
production baseline, not a pixel-perfect spec.) This is a **tighter**
version of the general safe-margin rule in
[production-quality-guidelines.md](production-quality-guidelines.md) - use
this file's bands specifically for the 9:16 format when the brief's target
platform is one of these apps; the general "middle ~80%" rule still applies
as-is to 16:9/1:1 formats that aren't going to be overlaid with that kind
of native app chrome (a website embed, a deck).

Practical application in a scene component: compute the safe band from
`useVideoConfig()` rather than hardcoding it only for a literal 1080×1920
canvas:

```tsx
const { width, height, orientation } = useFormatInfo();
const isVerticalSocial = orientation === "portrait";
const contentBounds = isVerticalSocial
  ? { top: height * 0.11, bottom: height * 0.78, left: width * 0.05, right: width * 0.9 }
  : { top: height * 0.1, bottom: height * 0.9, left: width * 0.1, right: width * 0.9 };
```

## Feed formats (1:1 / 4:5)

Less UI overlay risk than 9:16, but two things still matter:

- **Center-weighted composition.** Feed players sometimes show a square
  crop of a 4:5 post in list/grid contexts (e.g. a profile grid) - keep the
  focal element centred rather than relying on the full tall frame always
  being visible.
- **Autoplay is usually muted first.** Same "assume muted" rule as
  [production-quality-guidelines.md](production-quality-guidelines.md)'s
  captions-by-default guidance - doubly true in-feed, so on-screen
  text/labels need to work without sound at this ratio too.

## Typography per format

- **16:9** has the most horizontal room - on-screen text can run longer
  per line before wrapping awkwardly.
- **9:16/1:1** are narrower - the same sentence that fit on one line in
  16:9 may need a shorter rewrite or an explicit line break, not just a
  smaller font. Prefer shortening the on-screen text over shrinking it
  past [ui-ux-video-guidelines.md](ui-ux-video-guidelines.md)'s legibility
  floor.
- Compute font size from frame width (per the proportional-sizing pattern
  above) so the same string doesn't visually dominate a 1080-wide portrait
  frame while looking undersized on a 1920-wide landscape one when using
  the same literal `px` value.

## Per-scene-archetype guidance

| Scene shape | 16:9 | 1:1 / 4:5 | 9:16 |
|---|---|---|---|
| Browser/app mockup | Full window, generous chrome | Slightly cropped window, keep controls centred | Phone-width mockup or crop to just the relevant control (per [ui-ux-video-guidelines.md](ui-ux-video-guidelines.md)'s "strip UI to what the scene needs") |
| Side-by-side comparison (2-3 variants) | Row layout, all variants visible at once | Row if 2 variants, column if 3 | Column (stacked), per [content-formula.md](content-formula.md) |
| Big text/headline callout | Larger max-width, can center or left-align | Centered, tighter max-width | Centered, shortest line length, biggest relative font size |
| Chart/graph | Widest canvas, most room for axis labels | Simplify axis labels/legend first | Vertical bar/counter styles read better than wide horizontal-axis line charts - see [data-visualization.md](data-visualization.md) |
| Intro/outro logo/CTA | Logo can sit beside a tagline | Logo centred, tagline below | Logo + tagline stacked, kept inside the safe band above |

## Self-audit (fold into Gate 6/8)

The main `SKILL.md` already has you render a still for the primary format
plus the most visually different secondary format at Gate 6, and spot-check
every secondary format at Gate 8. Apply these checks at that point:

- [ ] Does every scene read its layout from `useVideoConfig()`/
      `useFormatInfo()` rather than a hardcoded pixel value tuned for one
      format?
- [ ] Does a multi-variant comparison scene reflow (row → column), not just
      shrink, between landscape and portrait?
- [ ] Is text re-wrapped/shortened per format rather than only resized?
- [ ] For a 9:16 format whose brief names TikTok/Reels/Shorts/Stories as a
      destination: is all critical content (text, logo, CTA, captions)
      inside the safe band above, not just inside the general safe-margin
      rule?
- [ ] Does anything clip, overflow, or float in obviously dead space in the
      secondary format's rendered still?
- [ ] If a component was given a per-format variant (Gate 4 step 5), does
      it still share the same theme tokens/motion presets as the primary
      version - only the arrangement should differ, not the palette/type/
      motion language?
