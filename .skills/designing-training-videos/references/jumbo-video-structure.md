# Jumbo AI Foundations: video structure (skill pointer)

**Canonical guide (read in full before scripting any Foundations video):**

[`courses/notes/jumbo-ai-video-structure-guide.md`](../../../courses/notes/jumbo-ai-video-structure-guide.md)

**Program spec:** [`courses/jumbo-ai-foundations-program.md`](../../../courses/jumbo-ai-foundations-program.md)

This file does not replace the guide. It is the skill-side lock so
`designing-training-videos`, `video-generate-explainer`, and the review
skills load the same rules.

## When it applies

- Every video in **AI Foundations at Jumbo** (all 22)
- Any later Jumbo training video that reuses this house structure
- Gate 1 / Gate 2 of `video-generate-explainer` when the brief is a
  Foundations episode

If the brief is a marketing teaser or product demo outside this course,
do **not** force the six-beat sheet. Use the generic explainer flow instead.

## The one rule

**One video, one idea, one takeaway.**

Takeaway must be writable as: *"After this, a learner can…"*  
If you need two such sentences, split into two videos.

## Canonical six beats (default ~6 min / ~850 words @ 140 wpm)

| # | Beat | Share | Job |
|---|------|-------|-----|
| 1 | Hook | ~8% | Meeting moment / discomfort. No agenda. No definitions. Implicit promise. |
| 2 | Concept | ~33% | Plain-language idea. **Zero new terms.** Analogy + where it breaks. |
| 3 | Name it | ~17% | Attach the term. `[PAUSE]`. On-screen. Define as callback to beat 2. |
| 4 | In the wild | ~17% | Real colleague sentence using the term. Unpack. Flag common misuse. |
| 5 | So what | ~17% | Specific judgement, trap, question, or risk - not a restatement. |
| 6 | Recap | ~8% | Exactly three lines (concept / term / behaviour). Spoken + on screen. Stop. |

Scale absolute times with runtime (3 / 5 / 6 / 7 min tables in the guide).
**Hard cap: 8 minutes.** Prefer split over trimming beats 4 or 6.

**Below 3 minutes:** Hook → Concept → Name it → Recap only (drop In the wild + So what).

## Hard limits (agents must enforce)

- Max **4** new terms per video (3 preferred); max one new term per ~90s
- **Zero** new terms in beat 2
- Beat 2 sentences under **20 words**
- Mark `[PAUSE]` after every new term and before the recap
- Delivery **140–150 wpm**; script to word budget for the runtime
- No em dashes; Australian English; second person
- No "in this video we will cover"; no "see you next time" sign-off
- Recap is the last thing they hear
- Every video stands alone (one-line refresher for borrowed terms, never "as we covered in module two")

## Variants (see guide Section 7)

| Type | Videos | Change |
|------|--------|--------|
| Vocabulary-cluster | 2.5, multi-term | Repeat Name it + In the wild per term |
| Scenario | 6.4, 3.4 | Hook → Scenario → Failure moment → Principle → Name it → Recap |
| Compliance | 6.1–6.3 | Add flat **The rule** beat before Recap; escalation card on screen |
| Landscape | 2.5, 5.3 | Shorter concept, longer so-what; isolate perishable specifics |

## Script review

Run the full checklist in the guide **Section 8** before Gate 2 approval.
`video-review-training` and `video-review-authenticity` must score against
that checklist for Foundations scripts, not the old agenda-path orient.

## Handoff into production

Gate 1 `brief.md` must include:

- Takeaway: `After this, a learner can…`
- Runtime target + word budget from the scaling table
- Beat sheet variant (default six / four-beat short / scenario / compliance / vocabulary-cluster)
- New terms list (≤4)
- Link to the program video id (e.g. `1.1`, `1.3`)

Gate 2 `script.md` must be labelled with the six beat headers
(`[BEAT 1: HOOK]`, etc.) matching the worked example in the guide.
