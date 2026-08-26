import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { saveScenePropsToManifestFile } from "./preview-api.js";

const minimalManifest = {
  schemaVersion: 2,
  slug: "solo",
  title: "Solo Video",
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 640, height: 360 }],
  tracks: [
    {
      id: "main",
      title: "Main",
      scenes: [
        {
          id: "01",
          title: "Hold",
          component: "src/A.tsx",
          durationInFrames: 10,
          props: { headline: "Original" },
        },
        {
          id: "02",
          title: "Next",
          component: "src/B.tsx",
          durationInFrames: 12,
          props: { headline: "Keep me" },
        },
      ],
    },
  ],
};

/**
 * Write a compact video.json and return its path.
 */
function writeManifest({
  dir,
  manifest,
}: {
  dir: string;
  manifest?: unknown;
}): string {
  fs.mkdirSync(dir, { recursive: true });
  const manifestPath = path.join(dir, "video.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest ?? minimalManifest));
  return manifestPath;
}

describe("saveScenePropsToManifestFile", () => {
  it("writes props onto the matching scene and leaves others unchanged", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-save-props-"));
    const manifestPath = writeManifest({ dir });

    const result = saveScenePropsToManifestFile({
      manifestPath,
      overrides: { "01": { headline: "Updated" } },
    });

    expect(result).toEqual({ ok: true });
    const saved = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      tracks: Array<{
        scenes: Array<{ id: string; props?: { headline?: string } }>;
      }>;
    };
    expect(saved.tracks[0]?.scenes[0]?.props).toEqual({ headline: "Updated" });
    expect(saved.tracks[0]?.scenes[1]?.props).toEqual({ headline: "Keep me" });
  });

  it("does not inject Zod defaults that were omitted from the file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-save-defaults-"));
    const manifestPath = writeManifest({ dir });

    saveScenePropsToManifestFile({
      manifestPath,
      overrides: { "01": { headline: "Updated" } },
    });

    const raw = fs.readFileSync(manifestPath, "utf8");
    const saved = JSON.parse(raw) as Record<string, unknown>;
    expect(saved).not.toHaveProperty("fps");
    expect(saved).not.toHaveProperty("assetsRoot");
    const scene = (
      saved.tracks as Array<{ scenes: Array<Record<string, unknown>> }>
    )[0]?.scenes[0];
    expect(scene).not.toHaveProperty("gapBeforeFrames");
    expect(scene).not.toHaveProperty("visualType");
  });

  it("rejects an unknown scene id and leaves the file untouched", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-save-unknown-"));
    const manifestPath = writeManifest({ dir });
    const before = fs.readFileSync(manifestPath, "utf8");

    const result = saveScenePropsToManifestFile({
      manifestPath,
      overrides: { missing: { headline: "Nope" } },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/Unknown scene id "missing"/);
    }
    expect(fs.readFileSync(manifestPath, "utf8")).toBe(before);
  });

  it("rejects an empty overrides object", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-save-empty-"));
    const manifestPath = writeManifest({ dir });

    const result = saveScenePropsToManifestFile({
      manifestPath,
      overrides: {},
    });

    expect(result).toEqual({
      ok: false,
      errors: ["No prop changes to save"],
    });
  });

  it("rejects non-object props", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-save-shape-"));
    const manifestPath = writeManifest({ dir });

    const result = saveScenePropsToManifestFile({
      manifestPath,
      overrides: { "01": "headline" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/must be a JSON object/);
    }
  });
});
