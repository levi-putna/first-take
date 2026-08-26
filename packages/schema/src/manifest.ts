import { z } from "zod";

/**
 * Aspect-ratio format used for a single render pass.
 */
export const formatSchema = z.object({
  id: z.string().min(1),
  aspectRatio: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/**
 * Optional visual bumper shown during the series-audio lead-in.
 */
export const leadInSchema = z.object({
  component: z.string().min(1).optional(),
  props: z.record(z.unknown()).optional(),
});

/**
 * Overarching audio layers and mix defaults for an explainer-style video.
 */
export const seriesAudioSchema = z.object({
  leadInSeconds: z.number().nonnegative().default(4),
  jingle: z.string().min(1).optional(),
  bed: z.string().min(1).optional(),
  narration: z.string().min(1).optional(),
  jingleVolume: z.number().min(0).max(2).default(0.55),
  bedVolumeUnderVo: z.number().min(0).max(2).default(0.12),
  bedVolumeLeadIn: z.number().min(0).max(2).default(0.08),
  jingleFadeOutSeconds: z.number().nonnegative().default(0.6),
  bedFadeInSeconds: z.number().nonnegative().default(0.8),
  bedFadeOutSeconds: z.number().nonnegative().default(1.2),
  tailSeconds: z.number().nonnegative().optional(),
});

/**
 * Fade (or future) transition into a scene.
 */
export const transitionInSchema = z
  .object({
    type: z.literal("fade"),
    durationInFrames: z.number().int().positive(),
  })
  .nullable();

/**
 * One timeline beat: a React component scene with optional narration timing.
 */
export const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  visualType: z.enum(["component", "generated-video", "real-video"]).default("component"),
  component: z.string().min(1),
  props: z.record(z.unknown()).optional(),
  durationInFrames: z.number().int().positive(),
  audioStartSeconds: z.number().nonnegative().optional(),
  audioEndSeconds: z.number().nonnegative().optional(),
  narration: z.string().optional(),
  transitionIn: transitionInSchema.optional(),
});

/**
 * Root video.json manifest (schemaVersion 1).
 */
export const videoManifestSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  fps: z.number().positive().default(30),
  formats: z.array(formatSchema).min(1),
  assetsRoot: z.string().default("."),
  leadIn: leadInSchema.optional(),
  seriesAudio: seriesAudioSchema.optional(),
  scenes: z.array(sceneSchema).min(1),
});

export type Format = z.infer<typeof formatSchema>;
export type LeadIn = z.infer<typeof leadInSchema>;
export type SeriesAudio = z.infer<typeof seriesAudioSchema>;
export type TransitionIn = z.infer<typeof transitionInSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type VideoManifest = z.infer<typeof videoManifestSchema>;
