# Natural typing animation

Whenever a scene shows text being entered into an input, search box,
code field, or similar control, **type one character at a time** at a
human-followable pace. Never dump a whole word, email, or phrase onto the
screen in one frame (or in large multi-character chunks). Chunk typing
reads as a bug or a slide transition, not as a person using the product.

**Canonical helper:** copy
[assets/typing.ts](../assets/typing.ts) into the production (or project)
shared folder - do not re-implement slicing ad hoc in each scene.

Pair with [camera-zoom-focus.md](camera-zoom-focus.md) (hold the subtle
zoom through the typing) and
[ui-ux-video-guidelines.md](ui-ux-video-guidelines.md) (cursor pause
before focus, explicit focus/caret state).

## Hard rule

**Characters appear via `typedText` / `typedTextOverDuration`** - one
index at a time through the string. Spaces, `@`, `.`, and punctuation
each count as their own step. No:

- `setText("hello@acme.com")` on a single frame
- Revealing whole words or 3–5+ character chunks as a "speed-up"
- Fading/sliding the full completed string in as if it were typed
- Using CSS/`content` tricks that aren't driven by `useCurrentFrame()`

If the typed string is too long for the beat even at the default fast
pace, **shorten the mock string** (or start mid-field with a believable
prefix already present and only type the distinctive suffix) - or stretch
with `typedTextOverDuration` / `durationFrames`. Don't jump to chunk
dumps.

## Default pace: ~35 characters / second

The skill helper defaults to **~35 chars/sec** at 30fps:

```ts
export const FAST_FRAMES_PER_CHAR = 30 / 35; // ≈ 0.857 frames per char
```

That is the intended product-demo feel - snappy, still character-wise,
readable on a short VO beat. Because 35 cps is slightly faster than 30
fps, a given frame may occasionally advance by **two** characters; that
is expected math, not a chunk dump. Whole-word or multi-character leaps
on purpose are not.

| Mode | How | Use when |
|---|---|---|
| **Default (fast)** | `typedText({ text, frame, startFrame })` | Most UI demos - emails, names, short search queries |
| **Fit the VO** | `typedTextOverDuration({ text, frame, startFrame, durationFrames })` | Narration holds longer on the field; still one char at a time, just slower |
| **Custom cps** | Pass `framesPerChar` (e.g. `30 / 20` for ~20 cps) | Explicitly calmer beat; rare |

Also budget:

| Moment | Frames @ 30fps | Feel |
|---|---|---|
| Pre-type dwell (focus + caret on, nothing yet) | **4–8** | "About to type" |
| Post-type dwell (full value + caret) | **6–12** | Read + "done" before click/tab |

Use `typingEndFrame` / `isTyping` from the helper to align zoom hold and
the next click with the real end of typing.

## How to include the helper (Gate 4)

When any scene types into a field:

1. Copy the skill file into the production:
   ```bash
   cp .skills/video-generate-explainer/assets/typing.ts \
     remotion/productions/{slug}/shared/typing.ts
   ```
   (Resolve the skill path from wherever this project installed
   `video-generate-explainer` - under `.skills/`, `.cursor/skills/`, etc.)
2. If `remotion/shared/typing.ts` already exists from a prior production,
   import that instead - don't fork a second copy
   ([reusable-components.md](reusable-components.md)).
3. Scenes import from the shared module; they never inline a new slicer.

## Remotion usage

```tsx
import { useCurrentFrame } from "remotion";
import {
  typedText,
  typedTextOverDuration,
  typingEndFrame,
  isTyping,
} from "../shared/typing";

// Default ~35 cps
const frame = useCurrentFrame();
const startType = 40;
const value = "demo@acme.com";
const typed = typedText({ text: value, frame, startFrame: startType });
const typingDoneAt = typingEndFrame({ text: value, startFrame: startType });

// Or stretch across a VO hold (still one char at a time):
const typedStretched = typedTextOverDuration({
  text: value,
  frame,
  startFrame: startType,
  durationFrames: 45,
});

const caretOn =
  frame >= startType - 6 &&
  frame <= typingDoneAt + 10 &&
  frame % 16 < 10; // blink ~1.8Hz while focused

// Render: {typed}{caretOn ? "|" : ""}  or a styled caret span
```

Practical rules:

1. **Slice the string** (`typedText` → `text.slice(0, n)`) - don't
   interpolate opacity across the whole phrase.
2. **Show a blinking caret** from just before the first character until
   blur/submit (or a short post-dwell).
3. **Budget time in Gate 3/6** with `typingEndFrame`. If the string still
   won't fit, shorten it or use `durationFrames` - don't chunk.
4. **Align with zoom hold** - ease-in finishes before or as typing
   starts; hold through `typingEndFrame` + post-dwell
   ([camera-zoom-focus.md](camera-zoom-focus.md)).
5. **Promote** to `remotion/shared/typing.ts` once a second production
   needs it.

## Choosing what to type

- Prefer **short, realistic mock values** the narration can name
  (`demo@acme.com`, `Acme`, `42`).
- For long real-world strings (API keys, paragraphs): show a **masked or
  truncated** value and type only the distinctive visible part, or cut
  away after enough characters that the action is clear.
- **Search boxes / filters:** typing 4–8 characters with results updating
  as length grows beats pasting a full query at once.
- **Code:** still character-wise for short snippets; for longer code
  prefer progressive line reveal *only if* the brief is about the
  finished block - and never for form/email/password fields.

## Password / sensitive fields

Type character-by-character into the control, but render **bullets/dots
per character** as they appear (length follows `typedCharCount`), not a
sudden row of dots. Optionally show a brief plaintext peek only if the
real product does and the brief needs it.

## Sync with narration

- If VO says "enter your work email", the field should be focused and
  mid-type (or just finishing) while that line plays - not already full
  before the line starts, and not still empty when the line ends.
- Don't lip-sync each phoneme to each key; match **start, pace band, and
  completion** (`typingEndFrame`) to the spoken beat.
- Prefer default ~35 cps; switch to `typedTextOverDuration` when the VO
  holds on the field longer than a fast type-out needs.
- If captions are on, the on-screen typed value is UI, not a caption -
  keep them from colliding (camera zoom / layout).

## Gate 3 / Gate 6 checklist

In `visualNotes`, name the exact string and pace, e.g.:

```text
Type demo@acme.com via shared typing.ts (~35 cps default); caret blink;
no chunk reveal. Zoom focusSubtle held through typingEndFrame + dwell.
```

Self-audit (Gate 6 stills at start / mid / end of the typing beat):

- [ ] Mid still shows a **partial** string (not empty→full between two
      nearby frames)?
- [ ] Progress is character-wise via `typedText` / `typedTextOverDuration`
      (at default pace, 1–2 chars/frame is OK; whole words are not)?
- [ ] Caret visible while focused?
- [ ] Typing finishes with a short dwell before the next click/tab?
- [ ] Duration fits without resorting to multi-character chunk dumps?
- [ ] Mock value is short enough to read at video size?
- [ ] Helper was copied/imported from `assets/typing.ts` (or
      `remotion/shared/typing.ts`), not reinvented in the scene?

## Don't

- Don't reveal whole words as units ("natural" is characters, not
  tokens).
- Don't use wall-clock `setInterval` / CSS typing animations - Remotion
  needs frame-driven length.
- Don't `Math.random()` per render for pacing - keep it deterministic.
- Don't invent a second typing utility in a scene file when the skill
  asset (or `remotion/shared/typing.ts`) already exists.
- Don't leave the completed value popping in under a cut with no typing
  beat when the narration is about entering it - either type it or don't
  claim the user typed.
