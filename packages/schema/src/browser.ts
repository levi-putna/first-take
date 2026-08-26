/**
 * Browser-safe schema exports (no Node fs/path).
 */
export {
  formatSchema,
  transitionInSchema,
  sceneSchema,
  trackSchema,
  videoManifestSchema,
  type Format,
  type TransitionIn,
  type Scene,
  type Track,
  type VideoManifest,
} from "./manifest.js";

export {
  sequentialOverlapFrames,
  trackDurationInFrames,
  totalDurationInFrames,
  contentDurationInFrames,
  scenePlacements,
  sceneStartFrames,
  listScenes,
  validateTransitionLengths,
  validateUniqueSceneIds,
  type ScenePlacement,
} from "./duration.js";
