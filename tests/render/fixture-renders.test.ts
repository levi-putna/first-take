import { describe, expect, it } from "vitest";
import {
  REPO_ROOT,
  fixtureRoot,
  loadExpectations,
  loadValidatedManifest,
  renderAndAssertMedia,
} from "../helpers/index.js";
import { totalDurationInFrames } from "@storyboard/schema";

describe("short fixture renders", () => {
  it(
    "solid-frames silent MP4",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "solid-frames",
      });
      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "solid-frames",
        formatId: "16x9",
        silent: true,
      });
    },
    300_000,
  );

  it(
    "fade-overlap silent MP4 duration matches overlap math",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "fade-overlap",
      });
      const { manifest } = loadValidatedManifest({ fixtureDir });
      expect(totalDurationInFrames(manifest)).toBe(50);
      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "fade-overlap",
        formatId: "16x9",
        silent: true,
      });
    },
    300_000,
  );

  it(
    "multi-format both sizes share frame count",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "multi-format",
      });
      const a = await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "multi-format",
        formatId: "16x9",
        silent: true,
      });
      const b = await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "multi-format",
        formatId: "9x16",
        silent: true,
      });
      expect(a.outputPath).not.toBe(b.outputPath);
    },
    300_000,
  );

  it(
    "audio-mix includes AAC; silent omits audio",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "audio-mix",
      });
      const exp = loadExpectations({ fixtureDir });
      expect(exp.durationInFrames).toBe(105);

      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "audio-mix",
        formatId: "16x9",
        silent: false,
      });

      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "audio-mix-silent",
        formatId: "16x9",
        silent: true,
      });
    },
    300_000,
  );

  it(
    "motion-basics silent MP4",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "motion-basics",
      });
      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "motion-basics",
        formatId: "16x9",
        silent: true,
      });
    },
    300_000,
  );
});
