---
name: designing-training-videos
description: >-
  Design corporate training video outlines, learning briefs, episode structures,
  pacing, and reinforcement for modern enterprise L&D. Focuses each video on one
  clear outcome, cuts fluff, and balances professional clarity with light
  engagement. Use when outlining a training course or episode, writing learning
  objectives, choosing a video structure template, planning tempo/pacing,
  drafting quiz or discussion prompts, reviewing whether a training script
  teaches what matters, or preparing content before video-generate-explainer
  production. Do NOT use for Remotion/render pipelines, live-action shoots, or
  marketing teasers with no learning objective.
version: 1.3.0
---

# Designing Training Videos

Instructional design skill for **modern corporate training videos**: clear,
modular, measurable, and watchable. Enterprise-credible without feeling
like compliance theatre. Pair with `video-generate-explainer` when it is
time to produce (brief → script → Remotion); this skill owns **what to
teach and how to shape it**, not the render pipeline.

**Jumbo AI Foundations (required):** before outlining or scripting any
video in that program, read the canonical structure guide in full:
[`courses/notes/jumbo-ai-video-structure-guide.md`](../../courses/notes/jumbo-ai-video-structure-guide.md)
and the skill pointer
[references/jumbo-video-structure.md](references/jumbo-video-structure.md).
That six-beat sheet (concept before name, in-the-wild, three-line recap)
**overrides** older agenda-path templates for Foundations work.

**Presenting craft** (how VO should feel: calm visual build, honest
limits, second person) lives in
[references/presenting-style.md](references/presenting-style.md). For
Foundations videos, combine it with the structure guide - the guide wins
on beat order and "no agenda / no sign-off". Critique of script
authenticity belongs in **`video-review-authenticity`**.

If the project has a `DESIGN.md` or `courses/` catalogue, read those first
and keep brand, locale, and series conventions. For Foundations, also read
[`courses/jumbo-ai-foundations-program.md`](../../courses/jumbo-ai-foundations-program.md)
for the specific video's covers / terms / takeaway.

If topic research notes exist under `research/` or
`courses/.../research/`, read `NOTES.md` before drafting the Learning
Brief. Prefer the Consumer handoff section over re-researching in chat.
If the topic is thin or ungrounded, run **`research-ground-topic`** first.

## When to use

- Outlining a course or a single training episode
- Tightening a bloated topic into one teachable video (or a short series)
- Choosing structure, tempo, and reinforcement
- Checking that the important idea will actually land
- Handing a solid learning brief into Gate 1 of `video-generate-explainer`

## Hard rules

1. **One primary learning objective per video.** For Foundations, also
   write the takeaway as *"After this, a learner can…"*. If you need two
   such sentences, split the video.
2. **Fill the Learning Brief before any script or scene plan.** The brief
   locks what must land. Everything else is supporting cast. Prefer
   grounded `NOTES.md` over uncited model knowledge when notes exist.
3. **Cut for coherence.** If a beat does not serve the primary objective
   or a named secondary must-know, remove it. Interesting ≠ important.
4. **Respect working memory.** Prefer 1 idea per scene beat; signal what
   matters; do not narrate a wall of on-screen text.
5. **Hook on a meeting moment / concrete tension** - not a logo linger or
   agenda dump. For Foundations: no "in this video we will cover"; end the
   hook with an implicit promise (see structure guide Beat 1).
6. **Concept before vocabulary.** For Foundations: beat 2 has **zero new
   terms**; beat 3 names them. Never reverse that order.
7. **Close with transfer.** Foundations: three-line recap (concept / term /
   behaviour), then stop - no "see you next video". Plus quiz bank items
   and summary card per the program spec.
8. **Engagement is purposeful.** Wit, contrast, and scenarios earn their
   place only when they carry the objective. No filler jokes, stock robot
   gags, or "fun" that dilutes the point. Never cut "in the wild" for time.
9. **Never use an em dash (—).** Prefer commas, full stops, colons,
   parentheses, or a spaced hyphen (` - `).
10. **Australian English** unless the project brief says otherwise.
11. **Hard runtime cap 8 minutes** for Foundations; default ~5–6 min;
    script at 140–150 wpm per the structure guide scaling table.

## Workflow

Copy and track:

```
Training design progress:
- [ ] 1. Audience and outcome
- [ ] 2. Learning Brief (must-land locked)
- [ ] 3. Structure template chosen
- [ ] 4. Beat map + tempo budget
- [ ] 5. Engagement plan (purposeful only)
- [ ] 6. Reinforcement (quiz / discussion)
- [ ] 7. Ready for production handoff
```

### 1. Audience and outcome

Confirm with the user (or from the course doc):

| Field | Ask |
|-------|-----|
| Audience | Role(s), prior knowledge, why they care this week |
| Context | LMS self-serve, workshop playback, manager-led, compliance |
| Change | What should someone **do or decide differently** after watching? |
| Constraints | Length target, must-include policy lines, tools they may name |

Default length for AI Foundations: **~5–6 minutes** (band 3–8; never past
8). If content will not fit without rushing or without cutting "in the
wild" / recap, **split into another video**. Use the structure guide's
word budgets. Micro-modules under **3 minutes** collapse to four beats
(Hook → Concept → Name it → Recap).

### 2. Learning Brief (must-land)

Copy [assets/templates/learning-brief.md](assets/templates/learning-brief.md)
into the course/episode doc (or present it for approval).

**Must-land test:** for each item in `Must land`, ask: "If the viewer
remembers only this, did the video succeed?" If no, demote it. Cap
**Must land** at **3 bullets** (ideally 1–2). Put nice-to-know in
`Leave out or later`.

Do not proceed until the user agrees the must-land list.

### 3. Choose a structure template

For **AI Foundations**, start from the structure guide. Map the program
video id to a variant, then use the matching template:

| Variant | Best when | File |
|---------|-----------|------|
| Concept (default six-beat) | Shared mental model; most Foundations videos | [structure-concept.md](assets/templates/structure-concept.md) |
| Scenario | Behaviour change (3.4, 6.4) | [structure-scenario.md](assets/templates/structure-scenario.md) |
| How-to / workflow | One task or process (rare in Foundations) | [structure-how-to.md](assets/templates/structure-how-to.md) |
| Myth vs fact | Misconceptions block adoption (optional colour inside Concept) | [structure-myth-bust.md](assets/templates/structure-myth-bust.md) |
| Series foundation | Legacy; prefer Concept + program video 1.1 for Foundations openers | [structure-series-foundation.md](assets/templates/structure-series-foundation.md) |

Read the chosen template **and** the structure guide in full. Map the
Learning Brief onto its beats. If beats exceed the tempo budget, **split**
- do not cut "in the wild" or the recap, and do not talk faster.

### 4. Beat map + tempo budget

For Foundations, use the scaling table in
[references/jumbo-video-structure.md](references/jumbo-video-structure.md)
(and the full guide). Percentages hold; absolute times move with runtime.

| Beat | ~Share | Job |
|------|--------|-----|
| Hook | ~8% | Meeting moment; implicit promise |
| Concept | ~33% | Plain language; zero new terms |
| Name it | ~17% | Term + pause + on-screen |
| In the wild | ~17% | Real sentence; unpack |
| So what | ~17% | Specific behaviour change |
| Recap | ~8% | Three lines; stop |

**Pacing rules (Foundations)**
- 140–150 wpm; mark `[PAUSE]` after every new term and before the recap.
- Beat 2 sentences under 20 words; densest load in beat 2, lighter in 4–5.
- Change visual focus when the spoken idea changes.
- Build diagrams progressively; no decorative seductive details.

Present a beat table: `beat | job | must-land link | ~seconds | ~words`.

### 5. Engagement plan (modern enterprise, not dry)

Read [references/tempo-and-engagement.md](references/tempo-and-engagement.md)
for the engagement palette, and
[references/presenting-style.md](references/presenting-style.md) for how
those techniques should *sound*. For Foundations, the structure guide's
beats **are** the engagement plan. Choose colour from:

- Meeting-moment hook that names the discomfort
- Concept-before-name (motivate in human terms before labels)
- Concrete "in the wild" sentence a colleague would actually say
- Analogy + where it breaks
- Specific so-what (judgement / trap / question / risk)
- Honest limit where overconfidence is a risk

**Ban list:** agenda dumps, "in this video we will cover", emoji storms,
meme piles, fake urgency, robot mascots, background music under dense
instruction, jargon flexing, tool-demo hype, brochure verbs ("leverage",
"empower", "embark on a journey"), cutting "in the wild" for time,
"see you in the next video" sign-offs.

### 6. Reinforcement

Every video gets **one** of:

- **2–4 quiz items** (recall + one application)
- **1–2 discussion prompts** (for workshops / team huddles)
- Both, if LMS + live delivery

Questions must target the **Must land** list, not trivia from a side
beat. Prefer "what would you do / how would you explain" over
definition parroting when the objective is application.

### 7. Production handoff

When the outline is approved and the user wants to produce:

1. Summarise into a Gate 1-ready pack: title, slug, theme/angle, target
   length, audience/tone, must-land, beat map, format (usually 16:9).
2. Invoke **`video-generate-explainer`** and start at Gate 1 - do not skip
   its planning brief.
3. Carry must-land into `brief.md` so Gate 8 can check brief fit against
   learning success, not only visual polish.

If the user only wants the outline, stop after step 6 and write into
`courses/{course}/COURSE.md` (or a new episode file). Do not start
Remotion work unless asked.

## Quality bar (pre-production critic)

Before calling the outline done, check (Foundations: also run guide
Section 8):

- [ ] Takeaway is one sentence: "After this, a learner can…"
- [ ] Must-land ≤ 3 and actually taught on-screen + in VO
- [ ] Meeting-moment hook; no agenda; no definitions in beat 1
- [ ] Zero new terms in beat 2; ≤4 new terms total
- [ ] All required beats present for the chosen variant
- [ ] Word count within ~10% of runtime target @ 140 wpm
- [ ] So-what is a specific behaviour, not a restatement
- [ ] Recap is exactly three lines; no soft sign-off
- [ ] Quiz items (2–3) map to must-land; terms on glossary card
- [ ] Coherence: fluff removed (see [references/principles.md](references/principles.md))

For a full written review (severity, fix owners, report file) of the plan,
script, or scenes, invoke **`video-review-training`** rather than expanding
this checklist into a long critique here. For authenticity, naturalness,
and presenting-style fit of the VO script, invoke
**`video-review-authenticity`**.

## Relationship to other skills

| Skill | Owns |
|-------|------|
| **research-ground-topic** | Evidence, definitions, confidence, citable `NOTES.md` |
| **designing-training-videos** (this) | Objectives, structure, tempo, presenting craft, what must land, reinforcement |
| **video-review-training** | Pre-production review of plan, script, scenes (issues + best practices) |
| **video-review-authenticity** | Script authenticity, naturalness, house presenting-style alignment |
| **video-generate-explainer** | Remotion production gates, narration sync, render, critic |
| Project `DESIGN.md` | Brand tokens, motion language, series chrome |

## Additional resources

- **Jumbo structure guide (canonical):** [`courses/notes/jumbo-ai-video-structure-guide.md`](../../courses/notes/jumbo-ai-video-structure-guide.md)
- Jumbo structure skill pointer: [references/jumbo-video-structure.md](references/jumbo-video-structure.md)
- Program spec: [`courses/jumbo-ai-foundations-program.md`](../../courses/jumbo-ai-foundations-program.md)
- Evidence base (Mayer, microlearning, corporate practice): [references/principles.md](references/principles.md)
- Tempo, energy, engagement palette: [references/tempo-and-engagement.md](references/tempo-and-engagement.md)
- House presenting style (calm visual build; Foundations defers to structure guide on beats): [references/presenting-style.md](references/presenting-style.md)
- Templates: [assets/templates/](assets/templates/)

