/**
 * Browser-safe schema exports (no Node fs/path).
 */
export {
  formatSchema,
  sceneSchema,
  trackSchema,
  videoManifestSchema,
  type Format,
  type Scene,
  type Track,
  type VideoManifest,
} from "./manifest.js";

export {
  trackDurationInFrames,
  totalDurationInFrames,
  contentDurationInFrames,
  scenePlacements,
  sceneStartFrames,
  listScenes,
  validateUniqueSceneIds,
  type ScenePlacement,
} from "./duration.js";
