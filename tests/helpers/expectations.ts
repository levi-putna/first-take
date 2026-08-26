import fs from "node:fs";
import path from "node:path";

export type FixtureExpectations = {
  fps: number;
  durationInFrames: number;
  formats: string[];
  stills: number[];
  silent?: boolean;
};

/**
 * Load expectations.json for a fixture directory.
 */
export function loadExpectations({
  fixtureDir,
}: {
  fixtureDir: string;
}): FixtureExpectations {
  const filePath = path.join(fixtureDir, "expected", "expectations.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing expectations: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as FixtureExpectations;
}

/**
 * Path to a golden still PNG for a format + frame index.
 */
export function goldenStillPath({
  fixtureDir,
  formatId,
  frame,
}: {
  fixtureDir: string;
  formatId: string;
  frame: number;
}): string {
  return path.join(
    fixtureDir,
    "expected",
    `still-frame-${formatId}-${frame}.png`,
  );
}

/**
 * Absolute path to an example fixture root.
 */
export function fixtureRoot({
  repoRoot,
  name,
}: {
  repoRoot: string;
  name: string;
}): string {
  return path.join(repoRoot, "examples", name);
}

/**
 * Path to video.json inside a fixture.
 */
export function fixtureManifestPath({
  fixtureDir,
}: {
  fixtureDir: string;
}): string {
  return path.join(fixtureDir, "video.json");
}
