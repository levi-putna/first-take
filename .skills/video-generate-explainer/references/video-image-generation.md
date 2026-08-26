# Generated video and image guidelines (AI Gateway)

This pipeline is code-first: prefer a Remotion component over a generated
asset whenever the shot can be drawn in code (see Gate 3/4). Reach for the
generation calls below only for the scenes/backgrounds explicitly approved
as `generated-video` or an AI-generated background image.

> **Your training data is likely stale on model slugs and SDK function
> names for this.** Both video and image generation on AI Gateway are
> recent additions to the AI SDK. Before writing code, check
> https://vercel.com/docs/ai-gateway/getting-started/video and
> https://vercel.com/docs/ai-gateway/capabilities/image-generation for the
> current function signature and parameter set - don't assume the examples
> below never change.

## Setup

```bash
npm install ai
```

Auth resolves the same way as any other AI Gateway call: `AI_GATEWAY_API_KEY`
if set, otherwise `VERCEL_OIDC_TOKEN` from `vercel env pull`. Only install/
configure this when a production's approved scene plan actually needs it -
don't add it at Gate 0 speculatively.

## Video generation (Veo, via `AI_GATEWAY_VIDEO_MODEL`)

```ts
import { experimental_generateVideo as generateVideo } from "ai";
import { writeFileSync } from "fs";

const model = process.env.AI_GATEWAY_VIDEO_MODEL ?? "google/veo-3.1-generate-001";

const result = await generateVideo({
  model,
  prompt: scene.videoSource.prompt,
  aspectRatio: "16:9", // match the production's aspectRatio from scenes.json
  duration: 4,          // Veo only accepts 4, 6, or 8 (seconds) - pick the closest fit to the scene's planned length, never a value in between
  resolution: "1080p",  // "720p" | "1080p" - match final export resolution, don't upscale a low-res generation
  generateAudio: false, // default to false: this pipeline's audio is the continuous ElevenLabs narration track, not the clip's own generated audio
});

writeFileSync(
  `public/video/${slug}/generated/${scene.id}.mp4`,
  result.videos[0].uint8Array,
);
```

### Fixed durations shape the plan, not the other way around

Veo only generates 4s, 6s, or 8s clips - there's no "generate exactly
5.3 seconds" option. When Gate 3 flags a `generated-video` scene, pick
whichever of 4/6/8 fits the beat, then write the *narration* (if any plays
over it) to fit that duration, not the reverse. A wordless generated scene
(no narration playing over it) is the easiest case - its duration is just
whatever the clip is.

### Prompting Veo for a UI-adjacent explainer

- Describe **one** clear subject/action per clip - Veo, like this whole
  pipeline's component scenes, degrades when asked to carry two ideas at
  once.
- Specify camera behaviour explicitly if it matters ("slow push-in", "static
  shot", "gentle pan left") - don't leave it to chance.
- State the background/setting plainly if it needs to match the rest of the
  video's mood (e.g. "dark background" to sit well against a dark-themed
  UI production).
- Avoid asking Veo to render UI chrome, text, or specific brand marks -
  generative video is unreliable at exact typography/layout; that's exactly
  what the component scenes are for. Keep generated clips to abstract/
  photoreal/environmental content, and let Remotion components carry
  anything with real on-screen text or UI.
- `generateAudio: true` is available (native audio-visual sync) but keep it
  `false` by default per the muting rule in the main SKILL.md - only flip it
  on for a scene deliberately designed as a wordless, sound-carrying beat
  (and call that out explicitly when presenting the scene at Gate 6).

### Cost and time awareness

Video generation is not free and not instant (can take from under a minute
to several minutes per clip, and costs real money per generation - check
current pricing at https://vercel.com/ai-gateway/models before assuming).
This is why Gate 3 requires explicit, separate approval before generating
anything, and why the "Do not" list forbids re-rolling a clip repeatedly. If
a first attempt is unusable, regenerate once with a revised prompt; if it's
still wrong, that's a sign the scene shouldn't have been `generated-video`
in the first place - take it back to Gate 3.

## Image generation (via `AI_GATEWAY_IMAGE_MODEL`)

Used for a Gate 4 background image, a Gate 7
**poster/thumbnail** (see [poster-generation.md](poster-generation.md) for
channel-specific design and prompting), or any other static support image
the production genuinely needs (never generate an image just to fill space -
see the relevance rule in design-and-continuity.md).

```ts
import { experimental_generateImage as generateImage } from "ai";
import { writeFileSync } from "fs";

const model = process.env.AI_GATEWAY_IMAGE_MODEL ?? "openai/gpt-image-2";

const result = await generateImage({
  model,
  prompt: "Soft abstract dark-navy gradient with faint diagonal light streaks, no text, no logos, no people",
  size: "1536x1024", // pick from the size guidance below - match aspect ratio, not just "big"
  providerOptions: {
    openai: {
      quality: "medium",  // "low" | "medium" | "high" | "auto" - see guidance below
      background: "opaque", // gpt-image-2 does not support "transparent" - see note below
    },
  },
});

writeFileSync(
  `public/video/${slug}/generated/${name}.png`,
  Buffer.from(result.image.base64, "base64"),
);
```

### Size

`gpt-image-2` accepts any resolution that satisfies: both edges are
multiples of 16, the long:short edge ratio is ≤3:1, and total pixels are
between 655,360 and 8,294,400. In practice, pick from:

| Use case | Size | Notes |
|---|---|---|
| Square backdrop/card art | `1024x1024` | Good general default; also the 1:1 feed poster size |
| 16:9 background (matches this skill's default aspect ratio) | `1536x1024` | Landscape; crop/scale to the exact composition dimensions in the component if they differ slightly |
| 16:9 YouTube / website poster | `1536x1024` or `1920x1088` | See [poster-generation.md](poster-generation.md); deliver toward YouTube's 1280×720 custom-thumbnail target |
| 9:16 background (vertical productions) | `1024x1536` | Portrait |
| 9:16 Shorts / Reels / TikTok poster | `1024x1536` | Centre the hook for profile-grid crop - see [poster-generation.md](poster-generation.md) |
| Higher-fidelity 16:9 backdrop | `2048x1152` (2K) | Use when the background fills most of the frame and softness would be visible; costs more, slower |

Don't reach for 4K (`3840x2160`) for a background that scenes' foreground
content mostly covers - it's slower/costlier for no visible benefit at
typical viewing sizes. Reserve higher sizes for when the image itself *is*
most of what's on screen.

### Quality

- `low` - fast drafts/iteration only. Don't ship this as a final background.
- `medium` - **default choice** for background/support images in this
  pipeline. Clean, production-usable, much cheaper/faster than `high`.
- `high` - use for **Gate 7 posters/thumbnails** (the image is the hero
  asset), or when a background contains small/dense text (rare) or needs to
  hold up as a close-up rather than a backdrop mostly covered by foreground
  content.

### Background colour / compositing

**`gpt-image-2` does not support a transparent background** (`background:
"transparent"` is not accepted for this model) - always request `"opaque"`
or `"auto"`. Plan accordingly:

- If the generated image only needs to sit *behind* everything (the common
  case - a Gate 4 background), opaque is fine: it fills the whole frame and
  foreground components render on top of it as normal DOM/React layers.
- If you actually need a **cut-out asset with transparency** (e.g. a prop
  that needs to float over other content with irregular edges), don't use
  `gpt-image-2` for it - either build it in code (SVG/CSS) instead, or use a
  model that does support transparent output, and say so explicitly when
  proposing it at Gate 4 rather than assuming `gpt-image-2` will produce one.
- When the background needs to read consistently behind UI-mockup
  foreground content (per the UI-layout-realism checklist), keep the
  generated image's *own* contrast/detail low in the areas foreground
  content will sit - busy image detail directly behind a card/button reads
  as clutter. Prompt for this explicitly ("soft, low-contrast, most detail
  concentrated at the edges, calm centre") rather than fixing it after the
  fact.

### Reuse, don't regenerate

Generate a given background/support image **once** and reference the same
file from every scene that needs it (same discipline as a shared component -
see design-and-continuity.md). Regenerating "the same" background per scene
will drift visually and cost more for no benefit.
