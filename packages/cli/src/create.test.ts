import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isStoryboardMonorepo,
  packageNameFromSlug,
  resolveDefaultOutDir,
  scaffoldVideoProject,
  storyboardCliCommand,
  titleFromSlug,
} from "./create.js";
import { validateVideoFile } from "@levi-putna/storyboard-schema";

describe("create helpers", () => {
  it("builds a package name from a slug", () => {
    expect(packageNameFromSlug({ slug: "My-Feature" })).toBe(
      "@storyboard/my-feature",
    );
  });

  it("derives a title from a slug", () => {
    expect(titleFromSlug({ slug: "focus-rings" })).toBe("Focus Rings");
  });

  it("prefers examples/<slug> when examples/ exists", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sb-create-cwd-"));
    fs.mkdirSync(path.join(root, "examples"));
    expect(resolveDefaultOutDir({ slug: "demo", cwd: root })).toBe(
      path.join(root, "examples", "demo"),
    );
  });

  it("detects the monorepo vs npx CLI command", () => {
    expect(isStoryboardMonorepo({ cwd: process.cwd() })).toBe(true);
    expect(storyboardCliCommand({ cwd: process.cwd() })).toBe("yarn storyboard");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sb-not-mono-"));
    expect(isStoryboardMonorepo({ cwd: tmp })).toBe(false);
    expect(storyboardCliCommand({ cwd: tmp })).toBe(
      "npx @levi-putna/storyboard",
    );
  });
});

describe("scaffoldVideoProject", () => {
  it("writes a valid silent video project", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-scaffold-"));
    const written = scaffoldVideoProject({
      slug: "demo-video",
      outDir,
      title: "Demo Video",
      withAudio: false,
      force: false,
    });

    expect(written).toContain("video.json");
    expect(written).toContain("src/scenes/01-Intro.tsx");
    expect(written).toContain("src/scenes/02-Point.tsx");
    expect(written).toContain("src/components/LeadIn.tsx");
    expect(written).toContain("assets/audio/.gitkeep");
    expect(fs.existsSync(path.join(outDir, "playground.ts"))).toBe(true);

    const result = validateVideoFile({
      manifestPath: path.join(outDir, "video.json"),
      checkAssets: true,
    });
    expect(result.ok).toBe(true);
  });

  it("refuses to overwrite a non-empty directory without force", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-scaffold-busy-"));
    fs.writeFileSync(path.join(outDir, "keep.txt"), "x");
    expect(() =>
      scaffoldVideoProject({
        slug: "busy",
        outDir,
        title: "Busy",
        withAudio: false,
        force: false,
      }),
    ).toThrow(/already exists/);
  });

  it("includes seriesAudio when withAudio is true", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-scaffold-audio-"));
    scaffoldVideoProject({
      slug: "with-audio",
      outDir,
      title: "With Audio",
      withAudio: true,
      force: false,
    });
    const raw = JSON.parse(
      fs.readFileSync(path.join(outDir, "video.json"), "utf8"),
    ) as { seriesAudio?: { narration?: string } };
    expect(raw.seriesAudio?.narration).toBe("assets/audio/narration.mp3");
  });
});
