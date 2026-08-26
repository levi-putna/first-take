import path from "node:path";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  REPO_ROOT,
  assertFixtureStills,
  comparePngFiles,
  fixtureRoot,
  loadExpectations,
  loadValidatedManifest,
} from "../helpers/index.js";
import { renderStill } from "@levi-putna/storyboard-renderer";

const FIXTURES = [
  "solid-frames",
  "fade-overlap",
  "multi-format",
  "audio-mix",
  "motion-basics",
  "motion-lab",
  "hello-explainer",
  "track-overlay",
] as const;

describe("golden stills", () => {
  for (const name of FIXTURES) {
    it(
      `${name} matches expected stills`,
      async () => {
        const fixtureDir = fixtureRoot({ repoRoot: REPO_ROOT, name });
        const expectations = loadExpectations({ fixtureDir });
        await assertFixtureStills({
          fixtureDir,
          fixtureName: name,
          expectations,
        });
      },
      300_000,
    );
  }
});

describe("render determinism", () => {
  it(
    "motion-lab renders the same sampled frames identically twice",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "motion-lab",
      });
      const { manifest, manifestPath } = loadValidatedManifest({ fixtureDir });
      const formatId = "16x9";
      // Sample across typewriter, floating boxes, pulse, and progress fill
      const frames = [45, 150, 250, 580];

      for (const frame of frames) {
        const dir = path.join(
          REPO_ROOT,
          "out",
          "test-stills",
          "motion-lab-determinism",
          `frame-${frame}`,
        );
        fs.mkdirSync(dir, { recursive: true });
        const first = path.join(dir, "a.png");
        const second = path.join(dir, "b.png");

        await renderStill({
          manifest,
          manifestPath,
          formatId,
          frame,
          outputPath: first,
        });
        await renderStill({
          manifest,
          manifestPath,
          formatId,
          frame,
          outputPath: second,
        });

        const diffOutputPath = path.join(
          REPO_ROOT,
          "out",
          "test-diffs",
          `motion-lab-determinism-${frame}-diff.png`,
        );
        const result = comparePngFiles({
          actualPath: second,
          expectedPath: first,
          // Stricter than golden budget — identical inputs should match closely
          maxDifferingFraction: 0.001,
          diffOutputPath,
        });

        expect(
          result.passed,
          `Frame ${frame} differed between two renders: ${result.diffPixels} pixels (${result.percentDiffering.toFixed(3)}%). Diff: ${diffOutputPath}`,
        ).toBe(true);
      }
    },
    300_000,
  );
});
