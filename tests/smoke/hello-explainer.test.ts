import path from "node:path";
import { describe, expect, it } from "vitest";
import { execa } from "execa";
import {
  REPO_ROOT,
  fixtureRoot,
  loadValidatedManifest,
  renderAndAssertMedia,
} from "../helpers/index.js";
import { totalDurationInFrames } from "@levi-putna/storyboard-schema";

describe("hello-explainer smoke", () => {
  it("CLI validate succeeds", async () => {
    const cliPath = path.join(REPO_ROOT, "packages/cli/dist/cli.js");
    const manifest = path.join(
      REPO_ROOT,
      "examples/hello-explainer/video.json",
    );
    const result = await execa("node", [cliPath, "validate", manifest]);
    expect(result.exitCode).toBe(0);
  });

  it(
    "renders both formats with matching duration",
    async () => {
      const fixtureDir = fixtureRoot({
        repoRoot: REPO_ROOT,
        name: "hello-explainer",
      });
      const { manifest } = loadValidatedManifest({ fixtureDir });
      expect(totalDurationInFrames(manifest)).toBe(315);

      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "hello-explainer",
        formatId: "16x9",
        silent: false,
      });
      await renderAndAssertMedia({
        fixtureDir,
        fixtureName: "hello-explainer",
        formatId: "9x16",
        silent: false,
      });
    },
    600_000,
  );
});
