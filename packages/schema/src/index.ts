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

export {
  resolveAssetPath,
  listRequiredAudioAssets,
  assertAssetsExist,
  resolveComponentPath,
  collectComponentPaths,
} from "./assets.js";

export {
  validateVideoFile,
  parseVideoManifest,
  type ValidateVideoResult,
} from "./validate.js";

export {
  STORYBOARD_PACKAGES,
  resolveStoryboardPackageRoot,
  resolveStoryboardAliasTarget,
  storyboardViteAliases,
  resolveReactPackageRoot,
  type StoryboardPackageId,
} from "./package-resolve.js";
