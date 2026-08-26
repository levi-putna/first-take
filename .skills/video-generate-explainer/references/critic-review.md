# Gate 8 - Critic review rubric and loop

Gate 8 is a self-critique pass performed on the actually-rendered
`final.mp4`, not a re-read of the plan. Its job is to catch what only shows
up once everything is assembled and timed together - things no single
scene's Gate 6 self-audit could have caught in isolation (overall pacing,
whether the narration actually sounds professional once spoken in full,
whether the brief as a whole landed).

Adopt the mindset of an independent producer reviewing a cut they didn't
make: skeptical, specific, and unwilling to wave through something "close
enough." A critic that just says "looks good" without checking each axis
concretely isn't doing the job.

## The three axes

### 1. Brief fit

- Does the finished video actually deliver what was confirmed at Gate 1
  (`brief.md` - topic, theme/angle, length, platform(s), audience/tone) and
  written/approved at Gates 2-3 (script, scene plan, key points per scene)?
- Does the total runtime **match `brief.md`'s current
  `targetLengthSeconds`** (within a reasonable margin - a few seconds of
  drift from transitions/rounding is normal)? Measure from the actual
  rendered file. **Content coverage leads:** if the cut teaches the
  must-land and the brief was updated to the real runtime, that is a pass.
  Fail if must-land was cut to protect an old time guess, if filler was
  padded to hit a number, or if the brief was left silently out of date.
  There is no fixed cap on the production itself.
- Was every format confirmed in `brief.md` actually rendered, at the right
  dimensions?
- Does every approved `generated-video`/`real-video` scene look like what
  was approved (right subject, right mood) - not a wrong tangent that
  happened to render successfully? If a beat used multiple chained clips to
  cover a longer span, do they cut together cleanly (no visible seam/repeat)?
- Is the opening an actual teaching hook on the first narrated frame (see
  production-quality-guidelines.md) rather than a slow, contentless wind-up
  after VO has started? (Series jingle lead-in of ~4s before narration is
  expected for Jumbo training - that is not a fail.)
- If series audio is enabled: is the shared jingle present, does it fade as
  VO starts, and is the soft bed ducked under narration (see
  [shared-audio-bed.md](shared-audio-bed.md))? Fail if VO starts at frame 0
  with no lead-in, if the bed masks speech, or if a one-off jingle was
  generated for this slug instead of using `public/video/_shared/`.

**Fail this axis** if the cut misses the brief's core idea / must-land, a
scene's content doesn't match what was approved, filler was padded to hit
a time number, must-land was starved to protect an early guess, or
`targetLengthSeconds` was left silently out of date relative to the real
runtime.

### 2. UI & animation clarity

Re-apply the design-and-continuity.md checklist, but at whole-video scope:

- Watching straight through (not scene-by-scene in isolation), is it always
  obvious what to look at and why?
- Do transitions between scenes read as intentional, or jarring/confusing?
- Does any scene's motion fight for attention with a neighbouring scene's
  residual visual (e.g. a transition that makes two unrelated elements
  overlap mid-cut)?
- If UI-mockup content appears, does it hold up at real playback speed (not
  just in a paused still) - text long enough to read at its on-screen
  duration, no flash-then-gone information?
- Does the background strategy chosen at Gate 4 stay consistent and never
  fight the foreground content for attention? Prefer kit `Background`
  continuity across the cut.
- Do title cards, term plates, compare rows, and lists look like the Jumbo
  kit (`remotion/shared`) rather than one-off restyles of the same idea?
- If camera zoom/focus is used, does it stay sparse and subtle (ease in,
  hold through the action, ease out; roughly 1.12–1.35× for ordinary UI)
  and land on the control the narration names - or does it feel seasick /
  decorative? See [camera-zoom-focus.md](camera-zoom-focus.md).
- If any field is "typed" on screen, does text appear character-by-character
  via `typedText` / `typedTextOverDuration` (~35 cps default), or does a
  full string/chunk pop in? See [natural-typing.md](natural-typing.md).
- If the brief is a `feature-walkthrough`, does the UI read as a
  reconstructed product screen (recognisable shell, finished mock data,
  shared page continuity) rather than a generic kit or a screenshot pan?
  See [feature-walkthrough-reconstruction.md](feature-walkthrough-reconstruction.md).

**Fail this axis** if a stranger watching once, at real speed, with sound,
couldn't say what each scene was showing and why. Also fail a walkthrough
that doesn't look like the product, a cut where zoom frequency/intensity
undermines comprehension, or typing that appears in chunks / all at once.

### 3. Script delivery professionalism

- Listen to the full narration in context (not just reading the transcript).
  Does it sound like a competent professional VO - natural pacing, correct
  emphasis, no rushed clauses, no awkward robotic cadence? Also check the
  **series mix**: jingle lead-in, fade under first words, bed clearly under
  speech (not competing).
- Do breath points/`<break>` tags land where a human speaker would actually
  pause, not mid-idea?
- Is the tone consistent with what was confirmed at Gate 1 throughout, or
  does it drift formal/casual mid-video?
- **No em dashes (—)** in the spoken script, on-screen labels/captions, or
  the poster/thumbnail text - fail and rewrite if any appear (skill hard
  rule).
- Does the narration finish speaking with reasonable lead-out before the
  video cuts, rather than getting clipped?
- If captions are enabled, do they match the spoken words and timing
  (spot-check a few, don't assume the alignment math was perfect)?

**Fail this axis** if the narration sounds rushed, mispaced, robotic, or
inconsistent in tone, regardless of whether the words on the page were
correct - or if an em dash (—) appears in script, on-screen copy, or the
poster/thumbnail.

## Report format

Write `productions/{slug}/critic/report-{n}.md`:

```md
# Critic report - iteration {n}

## Brief fit: PASS | FAIL
{One paragraph. If FAIL: the specific gap and which gate owns the fix.}

## UI & animation clarity: PASS | FAIL
{One paragraph per finding if FAIL, referencing scene id(s).}

## Script delivery: PASS | FAIL
{One paragraph. If FAIL: quote the specific line/moment.}

## Verdict: PASS | FAIL (n/3 iterations used)
```

Every finding must be concrete (name the scene id, the timestamp, or the
line of narration) - "the pacing feels off" without pointing at *where* is
not an actionable finding and shouldn't be written down as one.

## The loop

1. Run the review above against the current `final.mp4`.
2. If all three axes pass: present the report + video + poster together
   (main SKILL.md Gate 8, step 4) and wait for sign-off. Done.
3. If any axis fails: for each failing finding, identify the gate that owns
   the fix (script wording → Gate 2/5, scene plan/timing → Gate 3/5, a
   specific scene's build → Gate 6, assembly/transitions → Gate 7) and apply
   it there, following the Revisions table in the main SKILL.md.
4. Redo Gate 7 (re-render; regenerate the poster only if the fix changed
   theme/hook/format or the poster itself was rejected), then redo Gate 8
   (new `report-{n+1}.md`, `n` incremented).
5. **Cap at 3 iterations total.** If iteration 3's report still has a
   failing axis, stop looping. Present all 3 reports, the current render,
   and a plain statement of what's still unresolved and why it wasn't
   fixed automatically (e.g. it needs a decision only the user can make,
   like cutting a scene the user seems attached to) - hand it to the user
   rather than continuing silently.

Don't skip straight to "looks fine" to avoid the loop - the loop exists
because catching an issue here is far cheaper than the user catching it
after publishing.
