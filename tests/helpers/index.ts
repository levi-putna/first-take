export {
  comparePngFiles,
  type PixelDiffOptions,
  type PixelDiffResult,
} from "./pixelDiff.js";
export {
  ffprobeJson,
  videoStream,
  audioStream,
  assertDurationClose,
  type FfprobeResult,
  type FfprobeStream,
} from "./ffprobe.js";
export {
  loadExpectations,
  goldenStillPath,
  fixtureRoot,
  fixtureManifestPath,
  type FixtureExpectations,
} from "./expectations.js";
export {
  REPO_ROOT,
  shouldUpdateGoldens,
  loadValidatedManifest,
  renderAndAssertStill,
  assertFixtureStills,
  renderAndAssertMedia,
} from "./renderFixture.js";
