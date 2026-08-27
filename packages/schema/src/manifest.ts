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
 * One timeline beat: a React component scene with timing and props.
 */
export const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  visualType: z
    .enum(["component", "generated-video", "real-video"])
    .default("component"),
  component: z.string().min(1),
  props: z.record(z.unknown()).optional(),
  durationInFrames: z.number().int().positive(),
  /** Empty frames on this track before the scene starts. */
  gapBeforeFrames: z.number().int().nonnegative().default(0),
});

/**
 * One stacked timeline lane. Track 0 paints on the bottom.
 */
export const trackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  /** Optional preview note for the lane (studio sidebar). */
  description: z.string().min(1).optional(),
  scenes: z.array(sceneSchema),
});

/**
 * Root video.json manifest (schemaVersion 3).
 */
export const videoManifestSchema = z.object({
  schemaVersion: z.literal(3),
  slug: z.string().min(1),
  title: z.string().min(1),
  fps: z.number().positive().default(30),
  formats: z.array(formatSchema).min(1),
  assetsRoot: z.string().default("."),
  tracks: z.array(trackSchema).min(1),
});

export type Format = z.infer<typeof formatSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Track = z.infer<typeof trackSchema>;
export type VideoManifest = z.infer<typeof videoManifestSchema>;
