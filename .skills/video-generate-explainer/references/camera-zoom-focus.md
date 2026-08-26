# Camera zoom & focus (subtle punch-ins)

How to direct attention inside a UI scene the way polished screen-recording
tools do - especially [Screen Studio](https://screen.studio), whose
default product-demo feel is: **record the whole screen, then gently
reframe onto the action** (clicks, typing, focus changes) with smooth
easing, rather than cutting or flashing a highlight on every beat.

In Remotion there is no real camera. "Zoom" means a **frame-driven
transform on the UI stage** (`scale` + `translateX`/`translateY`) that
keeps the focal control near the centre of the composition while the rest
of the screen softens into context. Pair this with
[feature-walkthrough-reconstruction.md](feature-walkthrough-reconstruction.md)
when the brief is a page/feature walkthrough; use it sparingly on any
component scene that needs a momentary focus punch.

This is the medium-specific complement to
[design-and-continuity.md](design-and-continuity.md)'s "one idea, one
focus" rule and [ui-ux-video-guidelines.md](ui-ux-video-guidelines.md)'s
oversizing guidance: sometimes the layout stays full-screen for
credibility, and the **camera** does the focusing instead of stripping
the chrome away.

## The Screen Studio mental model (what to borrow)

Screen Studio's published behaviour and common demo practice:

1. **Action drives framing.** Zooms land on mouse clicks, text input,
   window/focus changes, and the control the viewer must notice - not on
   decorative chrome.
2. **Subtle over dramatic.** Product demos read best with light punch-ins
   (~1.1×–1.35×), not aggressive 2×+ crops that erase context. One widely
   shared Screen Studio settings walkthrough lands clean demos around
   **~1.14×** for a "slight zoom" - treat that as the default taste,
   not a hard constant.
3. **Ease in, hold, ease out.** The zoom transition itself is short;
   the **hold** while the action happens (typing, reading a label, a
   state change) is where most of the time lives. Then pull back (or
   reframe) before the next beat.
4. **Pace matches intent.** ~0.3s transitions feel snappy (developer
   workflows); ~1.0–1.5s feels cinematic (introducing a new screen).
   Match the Gate 1 audience/tone - don't mix both in the same scene
   without a reason.
5. **Wide → tight → wide (or next target).** Establish the full UI,
   punch in for the teaching moment, resolve outward (or pan to the next
   focal control) so the viewer never loses where they are on the page.
6. **Fewer zooms beat more zooms.** A jumpy timeline of rapid reframes
   is the main failure mode Screen Studio users report when auto-zoom
   over-fires. Prefer **3–5 meaningful zooms per short video**, or about
   **one zoom per spoken teaching beat** - never a zoom on every cursor
   twitch.
7. **Cursor and zoom cooperate.** Move the pointer with intent (shared
   `Cursor` + spring easing), pause briefly before/after the click, and
   let the camera settle on the same target - see
   [ui-ux-video-guidelines.md](ui-ux-video-guidelines.md).

Cite the product docs when you want the source of truth for the
metaphor: [Animations](https://screen.studio/guide/animations),
[Adding & editing zooms](https://www.screen.studio/guide/adding-editing-zooms),
[Auto-zoom](https://www.screen.studio/guide/auto-zoom),
[Manual zoom](https://www.screen.studio/guide/manual-zoom). Remotion
implements the *feel*, not the Screen Studio editor.

## When to zoom (and when not to)

**Do zoom when:**

- The viewer must notice a small control (input, toggle, icon button,
  validation message) inside a realistic full-page mock.
- Narration is mid-action: "type the email", "click Save", "watch this
  field turn invalid".
- A feature walkthrough is stepping through a real reconstructed screen
  (see feature-walkthrough-reconstruction.md) and stripping chrome would
  break "this looks like our app" credibility.
- The composition is 9:16 / small-screen and the focal control would
  otherwise be unreadably tiny.

**Don't zoom when:**

- The scene already isolates one oversized control (ui-ux oversizing is
  doing the focusing job).
- You're only decorating motion - zoom with no spoken or visual reason
  reads as nervous camera.
- Two competing focals exist - split the scene or mute one element first
  (design-and-continuity one-focus rule).
- A hard cut / scene change would be clearer than a pan across distant
  UI regions.
- You already zoomed in the previous beat and haven't returned to a
  readable wide shot - stacked zooms without a wide reset disorient.

## Defaults (put these in `shared/theme.ts`)

Name the presets once; scenes pass targets and timings, they don't invent
new easing curves per beat:

| Preset | Scale | Transition in/out | Hold | Use for |
|---|---|---|---|---|
| `focusSubtle` | **1.12–1.18** | 18–28 frames @ 30fps (~0.6–0.9s), ease-in-out | Until the action ends + 4–8 frames | Typing in an input, toggling a switch, a quiet emphasis |
| `focusStandard` | **1.2–1.35** | 12–20 frames (~0.4–0.7s) | Through the click + state change | Primary click targets, submitting a form, revealing an error |
| `focusDetail` | **1.4–1.6** (cap) | 10–16 frames | Short - only while the detail is spoken | Tiny icons, dense table cells, a single character in a string - rare |
| `focusCinematicIntro` | 1.05 → 1.15 | 30–45 frames (~1–1.5s) | Optional | Opening a new screen; establishing shot, not a click response |

Hard caps:

- Prefer **≤ 1.35×** for product UI. Above that, context collapses and
  text can look soft after export/compression.
- Never jump scale without interpolating - always ease both axes of
  translation with the scale so the focal point stays optically centred.
- One active camera move at a time. Don't zoom while also sliding a
  full-page horizontal pan unless the pan *is* the zoom target change
  (reframe).

Easing: use `Easing.inOut(Easing.cubic)` (or a named `spring` with high
damping) for the scale/translate - Screen Studio's polished feel is
**ease-in-out**, not linear, and not a bouncy spring that overshoots the
focal control.

## Remotion implementation pattern

Treat the reconstructed (or mocked) UI as a **stage**, and wrap it in a
shared camera component. Drive everything from `useCurrentFrame()` -
never CSS `transform` transitions.

```tsx
// productions/{slug}/shared/CameraFocus.tsx (sketch)
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { motion } from "./theme";

type FocusBeat = {
  /** Frame the ease-in starts */
  startFrame: number;
  /** Frames to reach full zoom */
  easeInFrames: number;
  /** Frames held at full zoom (action lives here) */
  holdFrames: number;
  /** Frames to ease back (0 = stay zoomed / cut away) */
  easeOutFrames: number;
  scale: number; // e.g. 1.15
  /** Focal point in stage coordinates (px from stage top-left) */
  originX: number;
  originY: number;
  stageWidth: number;
  stageHeight: number;
};

/**
 * Applies a Screen-Studio-style punch-in around a focal point.
 * Compose under an overflow:hidden frame so scaled UI doesn't spill.
 */
export const CameraFocus: React.FC<{
  beat: FocusBeat;
  children: React.ReactNode;
}> = ({ beat, children }) => {
  const frame = useCurrentFrame();
  const {
    startFrame,
    easeInFrames,
    holdFrames,
    easeOutFrames,
    scale,
    originX,
    originY,
    stageWidth,
    stageHeight,
  } = beat;

  const easeOutStart = startFrame + easeInFrames + holdFrames;
  const endFrame = easeOutStart + easeOutFrames;

  const progress = interpolate(
    frame,
    [startFrame, startFrame + easeInFrames, easeOutStart, endFrame],
    [0, 1, 1, easeOutFrames === 0 ? 1 : 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const currentScale = interpolate(progress, [0, 1], [1, scale]);
  // Keep the focal point centred as we scale.
  const tx = (stageWidth / 2 - originX) * (currentScale - 1);
  const ty = (stageHeight / 2 - originY) * (currentScale - 1);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${currentScale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

Practical rules for the pattern:

1. **Put `overflow: "hidden"` on the camera frame** so scaled UI never
   bleeds outside the composition (or outside the browser chrome mock).
2. **Compute `originX`/`originY` from the focal control's layout**, not
   guessed magic numbers - preferably constants next to the mock's layout
   (e.g. `FOCAL.emailInput = { x: 640, y: 420 }`) so Gate 6 edits stay
   honest when the layout shifts.
3. **Align zoom hold with narration + action.** If ElevenLabs timestamps
   say the line "enter your work email" spans frames 120–160, the ease-in
   finishes *before* or as typing starts, and hold covers the typing.
4. **Chain reframes, don't nest cameras.** To move from input A to button
   B, interpolate origin/scale from beat A → beat B (a pan-zoom), or ease
   out to 1× then ease in on B. Don't wrap `CameraFocus` inside another
   `CameraFocus`.
5. **Promote to `remotion/shared/CameraFocus.tsx`** once a second
   production needs the same helper - see
   [reusable-components.md](reusable-components.md).

## Interaction recipes

### Typing in an input

1. Wide shot of the form (readable context).
2. Cursor moves to the field → brief pause.
3. `focusSubtle` ease-in to the input.
4. Caret blink + **one character at a time** via the shared typing helper
   (~35 cps default, or `typedTextOverDuration` to fit VO) - never a
   whole-string dump. Full rules: [natural-typing.md](natural-typing.md)
   · helper: [assets/typing.ts](../assets/typing.ts).
5. Hold through the last character + a beat of "done".
6. Ease out (or reframe to the next field) before the next spoken step.

### Clicking a control

1. Cursor eases to the target; pause ~4–8 frames.
2. `focusStandard` ease-in finishes just as the click lands (or a few
   frames before).
3. Explicit state signal on click (pressed style, ripple, or immediate
   result) - zoom alone is not the state change.
4. Hold while the result is visible and spoken.
5. Ease out or cut to the next scene if the result is a full navigation.

### Validation / small detail

1. Prefer `focusDetail` only if oversizing the message would break the
   "real screen" illusion.
2. Keep hold short - once the viewer has read it, pull back.
3. Pair with a colour/icon signal so the zoom isn't the only cue.

## Planning at Gate 3 / building at Gate 6

When a scene needs camera focus, write it into `visualNotes` (and
optionally a structured field if helpful), e.g.:

```text
visualNotes: "Full settings page mock. Zoom focusSubtle on Email input
while typing demo@acme.com via shared typing.ts (~35 cps); ease-in 20f,
hold through typingEndFrame, ease-out 16f. Then reframe focusStandard onto
Save button for the click."
```

Self-audit (add to the Gate 6 still check when zoom is used):

- [ ] Would removing the zoom still leave the action understandable? If
      yes and the scene is already oversized/simple, drop the zoom.
- [ ] Is peak scale ≤ ~1.35 for ordinary UI (or justified if higher)?
- [ ] Does ease-in/out use the shared preset, not a one-off linear jump?
- [ ] Is the focal point actually the control the narration names?
- [ ] After export compression, is text at peak zoom still sharp?
- [ ] Counting the whole video: are zooms sparse enough that watching
      muted still feels calm rather than seasick?

## Don't

- Don't zoom on every cursor move or every word of narration.
- Don't combine a strong zoom with a strong full-element scale animation
  on the same control - pick one emphasis channel.
- Don't auto-port Screen Studio's "zoom everything the mouse touched"
  behaviour into Remotion; **author** zooms against spoken beats.
- Don't use CSS/Tailwind transitions for the camera - frame-driven only.
- Don't crop so tightly that browser chrome / page identity disappears
  unless the brief is a component-only close-up by design.
