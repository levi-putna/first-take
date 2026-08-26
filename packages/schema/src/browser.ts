/**
 * Browser-safe schema exports (no Node fs/path).
 */
export {
  formatSchema,
  leadInSchema,
  seriesAudioSchema,
  transitionInSchema,
  sceneSchema,
  videoManifestSchema,
  type Format,
  type LeadIn,
  type SeriesAudio,
  type TransitionIn,
  type Scene,
  type VideoManifest,
} from "./manifest.js";

export {
  leadInFrames,
  contentDurationInFrames,
  totalDurationInFrames,
  validateTransitionLengths,
  sceneStartFrames,
} from "./duration.js";
