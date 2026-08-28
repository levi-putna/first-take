# First Take: Design System

> Single source of truth for brand, visual design, and component decisions. Use this file when building UI, reviewing designs, or prompting AI tools.

Visual language: white-first canvas, magenta brand primary (`#FF0073`), deep plum for ink and dark chrome, plum-tinted off-white for quiet panels, Radio Canada Big display, generous whitespace, soft-rectangular product UI.

---

## Brand Identity

**Name:** First Take  
**Tagline:** Explainer videos you can edit, not just generate.  
**Personality:** Capable, calm, precise. Professional and trustworthy without feeling corporate or cold. Not hype. Not cinematic AI spectacle.  
**Voice:** Plain language. Australian English. Direct and clear. AI assists; the creator stays in control.

### Product posture

First Take is a UI-driven production tool for explainer and edit-style videos. Creators plan a brief, arrive at a script and scene plan via several input paths, author and reuse React graphic components, then cut and assemble on a timeline. Rendering uses the First Take React graphic engine (not Remotion). The visual default is component / infographic scenes, not generative film.

### Logo

Assets live under `public/img/`. Use the `AppLogo` component (`src/ui/components/app-logo`) rather than inlining assets.

| Variant | Asset | When |
|---|---|---|
| **Mark** (default) | `logo-white.svg` on a square with `rounded-sm` and a top-left → bottom-right gradient `#171C27` → `#090C14` | Primary brand moments: home, shell headers, empty states |
| **Logo (light)** | `logo-black.svg` | Bare mark on light / white surfaces |
| **Logo (dark)** | `logo-white.svg` | Bare mark on dark surfaces |
| **Thumbnail** | `icons/icon-small.png` | Compact chrome, favicons, dense lists |

Lockup: mark beside the **First Take** wordmark in Radio Canada Big.

- Prefer `AppLogo` over one-off `<img>` tags
- Minimum mark / thumbnail size: 24×24px
- Clear space: equal to the container width on all sides
- Never stretch, recolour outside the surface rules, or add drop shadows

---

## Colour System

White is the dominant background colour. Magenta (`#FF0073`) is the primary brand colour for actions, logo, and focus moments. Deep plum anchors text, dark chrome, and marketing sections. Soft plum-tinted lights support quiet chrome fills. Colour is emphasis, not wallpaper.

**The rule of thumb:** if in doubt, use white. Reach for a coloured section only when you need to signal a transition or create a deliberate moment of emphasis.

### Colour harmony (plum family)

Plum `#1A0612` sits near **HSL(330°, 62%, 6%)** — a warm magenta-red. Light surfaces share that hue at high lightness and low chroma (analogous tinting). Cool greys (stone) and candy-pink fills fight the brand; quiet plum paper and deep plum chrome keep the family coherent.

| Role | Approach |
|---|---|
| **Dark chrome** | Full plum `#1A0612` — app sidebar, explorer category rail, auth cover, marketing dark sections |
| **Elevated dark** | Plum-mid `#3D0F28` — hover / open on dark chrome, cards inside dark sections |
| **Quiet light chrome** | Off-white `#F6F0F3` — explorer panel body, muted fills, alternating sections (tint of plum, not cool grey) |
| **Canvas** | White `#FFFFFF` — page, editor preview, shared `h-14` header bands |
| **Accent soft** | Magenta-soft `#FFD6E8` — selection and CTA bands only (higher chroma on purpose) |

### Core Palette

| Token | Hex | Role |
|---|---|---|
| `--color-white` | `#FFFFFF` | Primary page and app background. Default for all content sections. |
| `--color-off-white` | `#F6F0F3` | Plum-tinted paper. Quiet chrome fills, explorer body, muted surfaces, table headers. |
| `--color-magenta` | `#FF0073` | Brand primary. Default buttons, playhead, eyebrows on dark, marketing highlight moments. |
| `--color-magenta-soft` | `#FFD6E8` | Lightest pink tint. Selected rows, soft chips, accent bands, card fills on white. |
| `--color-magenta-hover` | `#DB0062` | Hover / pressed magenta surfaces. |
| `--color-plum` | `#1A0612` | Deep plum. Body/heading ink on light, dark chrome (sidebar, explorer tabs), marketing dark sections. |
| `--color-plum-mid` | `#3D0F28` | Mid-tone plum. Hover on dark chrome; card backgrounds inside dark sections. |
| `--color-ink` | `#1A0612` | Body and heading text on light backgrounds. Same value as plum. |
| `--color-ink-muted` | `#9A6480` | Secondary text: labels, captions, metadata. |
| `--color-border` | `#E5D4DD` | Subtle plum-rose hairline on cards and inputs. |
| `--color-danger` | `#C44B47` | Errors, destructive actions, required markers. |
| `--color-danger-soft` | `#F5E0DE` | Error banners and validation backgrounds. |
| `--color-warning` | `#A8651A` | Caution and pending states. |
| `--color-warning-soft` | `#F8ECDC` | Warning bands. |
| `--color-info` | `#2D6A9F` | Informational states (not brand). |
| `--color-info-soft` | `#E0ECF5` | Info banners. |

### Semantic Mapping

```css
--background:           #FFFFFF;
--background-subtle:    #F6F0F3;
--background-accent:    #FFD6E8;
--background-dark:      #1A0612;

--foreground:           #1A0612;
--foreground-muted:     #9A6480;
--foreground-inverse:   #FFFFFF;

--primary:              #FF0073;
--primary-foreground:   #FFFFFF;
--primary-hover:        #DB0062;

--secondary:            #F6F0F3;
--secondary-foreground: #1A0612;

--muted:                #F6F0F3;
--muted-foreground:     #9A6480;

--accent:               #FFD6E8;
--accent-foreground:    #1A0612;

--destructive:          #C44B47;
--border:               #E5D4DD;
--ring:                 #FF0073;

--sidebar:              #1A0612;
--sidebar-foreground:   #FFFFFF;
--sidebar-primary:      #FF0073;
--sidebar-accent:       #3D0F28;
--sidebar-border:       rgb(255 255 255 / 12%);
```

### Section Colour System

Most sections use white or off-white. Dark and accent sections are used sparingly for rhythm, not as the default in the app.

| Type | Background | Text colour | Frequency |
|---|---|---|---|
| **Default** | `#FFFFFF` white | `--color-ink` | Most sections |
| **Subtle** | `#F6F0F3` off-white | `--color-ink` | Alternating light sections, quiet chrome panels |
| **Accent** | `#FFD6E8` magenta-soft | `--color-ink` | CTA bands, callout sections |
| **Dark** | `#1A0612` plum | `#FFFFFF` | Marketing hero, testimonial, footer, app sidebar, explorer tab rail |

**Cadence example for a landing page:**

```
Hero          → Dark          (strong opening)
Social proof  → White         (breathing room)
Features      → Off-white     (differentiated but light)
CTA band      → Accent        (magenta-soft, draws attention)
Feature rows  → White         (content, spacious)
Testimonial   → Dark          (one more dark moment)
Pricing       → Off-white     (calm, readable)
Final CTA     → Accent        (closes with energy)
Footer        → Dark          (grounds the page)
```

Avoid placing two dark sections back-to-back. Never use more than 3 dark sections on a single page.

---

## Typography

Radio Canada Big gives display headings a bold, contemporary presence. Inter handles everything else: UI, body, labels, cleanly and at scale.

### Typefaces

| Role | Typeface | Source |
|---|---|---|
| **Display / Headings** | Radio Canada Big | Google Fonts (free) |
| **UI / Body / Labels** | Inter | Google Fonts (free) |
| **Code** | JetBrains Mono | Google Fonts (free) |

Radio Canada Big weight **700 only** for display and section headings. Use `font-display` or `font-heading` (both set weight 700).

### Type Scale

| Role | Font | Weight | Desktop | Mobile |
|---|---|---|---|---|
| **Display** | Radio Canada Big | 700 | 60–72px | 40–48px |
| **H1** | Radio Canada Big | 700 | 48px | 32px |
| **H2** | Radio Canada Big | 700 | 36px | 26px |
| **H3** | Inter | 600 | 22px | 18px |
| **H4** | Inter | 600 | 18px | 16px |
| **Eyebrow** | Inter | 600 | 11px · ALL CAPS · 0.1em tracking | - |
| **Body** | Inter | 400 | 16px · 1.65 line-height | - |
| **Body Large** | Inter | 400 | 18px · 1.7 line-height | - |
| **Caption** | Inter | 500 | 12px | - |
| **Mono** | JetBrains Mono | 400 | 14px | - |

### Font Setup

Loaded via `next/font/google` in `src/app/layout.tsx`:

```tsx
import { Inter, JetBrains_Mono, Radio_Canada_Big } from "next/font/google";

const radioCanadaBig = Radio_Canada_Big({
  variable: "--font-radio-canada-big",
  subsets: ["latin"],
  weight: "700",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
```

`--font-display` and `--font-heading` map to Radio Canada Big. Use `font-display` for marketing/section headings. Dense app chrome may use Inter for titles when Radio Canada Big would fight the density.

### Typography Rules

- Display and H1 headlines may run to 2 lines; that creates weight. Do not fight it.
- Major marketing sections open with an eyebrow label followed by a Radio Canada Big heading.
- Eyebrow colour: `--color-magenta` on dark sections, `--color-ink-muted` on light sections.
- Body text max width: ~65 characters (approx `640px` / prose `740px`). Never stretch body copy full-width.
- Never centre-align paragraphs. Centre only: eyebrows and headings in hero/CTA sections.
- Headings on white or off-white: `--color-ink`. Headings on dark: `#FFFFFF`.
- Mono for timing metadata in editors and playgrounds.

---

## Spacing and Whitespace

Whitespace is the primary design tool. Sections should feel uncrowded. When in doubt, add more vertical space, not less.

### Base Scale (4px grid)

```
4px   · --space-1   · micro gaps, icon padding
8px   · --space-2   · tight inline spacing, padding-xs
12px  · --space-3   · small element gaps
16px  · --space-4   · default element spacing, padding-sm
24px  · --space-6   · card padding, padding-md
32px  · --space-8   · section sub-divisions, padding-lg
48px  · --space-12  · component-level spacing, tablet gutter
64px  · --space-16  · between major content blocks
96px  · --space-24  · section vertical padding (desktop)
128px · --space-32  · hero vertical padding
```

### Padding

| Token | Utility | Value | Use |
|---|---|---|---|
| `--padding-xs` | `p-2` | 8px | Micro insets, tag padding |
| `--padding-sm` | `p-4` | 16px | Compact data: list rows, dialog body |
| `--padding-md` | `p-6` | 24px | Cards, widgets, app content area |
| `--padding-lg` | `p-8` | 32px | Featured marketing cards |
| `--padding-xl` | `px-12` | 48px | Section horizontal gutter (tablet+) |
| `--padding-2xl` | `py-24` | 96px | Section vertical padding (desktop) |

### Page Layout

- Max content width: `1200px`
- Horizontal padding: `24px` mobile · `48px` tablet · `96px` desktop
- Section vertical padding: `96px` desktop · `64px` tablet · `48px` mobile
- Text content columns: max `740px` for body-heavy sections

### Responsive design

First Take is **desktop-first, mobile-aware**. Editors and timeline views are optimised for creators at a desk. Primary paths must remain usable on a phone.

| Token | Min width | Role |
|---|---|---|
| `sm` | 640px | Secondary metadata |
| `md` | 768px | Mobile/desktop boundary: sidebar sheet |
| `lg` | 1024px | Multi-column editor layouts |
| `xl` | 1280px | Full editor grids and side panels |

### Whitespace Principles

1. Let headings breathe. `mb-3` below eyebrow, `mb-4` minimum below H2 before body.
2. Cards do not touch edges. Always `24px` internal padding minimum in product panels.
3. Feature grids: `32px` gap between cards.
4. Do not fill every pixel. Empty space is intentional.

---

## Border Radius

Rectangular with a small radius in product UI. Marketing surfaces use larger values for expressive layout blocks.

### Product scale

| Token | Utility | Value | Use |
|---|---|---|---|
| `--radius-xs` | `rounded-xs` | 2px | Badges, tags, status pills |
| `--radius-sm` | `rounded-sm` | 4px | Buttons, inputs, notifications, widgets, dialogs, logo mark. **Default for app UI.** |
| `--radius-md` | `rounded-md` | 8px | Dropdown items, sidebar nav, system avatars |

### Marketing scale

| Token | Utility | Value | Use |
|---|---|---|---|
| `--radius-lg` | `rounded-lg` | 12px | Marketing cards, bento inner cells |
| `--radius-xl` | `rounded-xl` | 16px | Wide editorial cards, visual frames |
| `--radius-2xl` | `rounded-2xl` | 24px | Hero headline bands |
| `--radius-expressive` | `rounded-[28px]` | 28px | Bento outer wrapper, hero corner curves |

**Hard rules:**

- Product UI defaults to `rounded-sm` (4px). Use `rounded-xs` (2px) only for tags and badges.
- Do not carry marketing radii (`rounded-lg` and above) into dense editor chrome.
- All interactive elements (buttons, inputs) use `4px`.
- `border-radius: 9999px` (pill) is reserved for people avatars and decorative play controls. System avatars use `8px` (`rounded-md`).
- The logo mark always uses `4px`.

---

## Elevation and Depth

1. Flat surfaces with `--border`
2. Soft lift for floating menus and dialogs (`0 8px 24px rgba(26,6,18,0.08)`)
3. Bordered cards may use `0 1px 3px rgba(0,0,0,0.08)` sparingly on white
4. No glow stacks, neon rings, or glassmorphism in product chrome


## Token implementation

Tokens live in `src/app/globals.css` (`:root` / `.dark`) and map into Tailwind via `@theme inline`. When this document and CSS disagree, update both in the same change.

---

## AI Prompt Snippet

Include this block when prompting AI tools to build First Take UI:

> **Brand:** First Take is an ai first video editing tool.
>
> **Colours:** White (`#FFFFFF`) is the dominant canvas. Off-white (`#F6F0F3`) is plum-tinted quiet chrome (explorer panels, muted fills). Magenta (`#FF0073`) is the brand primary: default buttons, playhead, logo, eyebrows on dark, and focus rings. Deep plum (`#1A0612`) for ink text, dark chrome (app sidebar, explorer tabs, auth cover), and marketing dark sections. Magenta-soft (`#FFD6E8`) for accent sections and selected fills. Borders use plum-rose `#E5D4DD`.
>
> **Typography:** Radio Canada Big (weight 700) for display and section headings. Inter for UI, body, and labels. JetBrains Mono for codes and timings. Wordmark lockups use Radio Canada Big beside the mark.
>
> **Style:** Rectangular forms in product UI: `4px` radius on buttons, inputs, and panels; `2px` on badges. Marketing cards use `12px` and above. No pill shapes in product UI. Generous whitespace. Professional but not corporate.
>
> **Buttons:** Magenta fill + white text for primary on light and dark. Outline for secondary. No pill shapes.

---

## References

- Requirements: `.doc/`
