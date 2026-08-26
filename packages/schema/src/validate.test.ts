import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertAssetsExist,
  collectComponentPaths,
  parseVideoManifest,
  resolveAssetPath,
  resolveComponentPath,
  sceneStartFrames,
  validateVideoFile,
} from "./index.js";

const base = {
  schemaVersion: 1 as const,
  slug: "test",
  title: "Test",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 1920, height: 1080 }],
  scenes: [
    {
      id: "01",
      title: "Hook",
      visualType: "component" as const,
      component: "scenes/01.tsx",
      durationInFrames: 90,
      transitionIn: null,
    },
    {
      id: "02",
      title: "Fix",
      visualType: "component" as const,
      component: "scenes/02.tsx",
      durationInFrames: 120,
      transitionIn: { type: "fade" as const, durationInFrames: 15 },
    },
  ],
};

describe("sceneStartFrames", () => {
  it("accounts for lead-in and fade overlaps", () => {
    const manifest = parseVideoManifest({
      ...base,
      seriesAudio: {
        leadInSeconds: 4,
        jingleVolume: 0.55,
        bedVolumeUnderVo: 0.12,
        bedVolumeLeadIn: 0.08,
        jingleFadeOutSeconds: 0.6,
        bedFadeInSeconds: 0.8,
        bedFadeOutSeconds: 1.2,
      },
    });
    // lead 120; scene1 @ 120; scene2 @ 120+90-15 = 195
    expect(sceneStartFrames(manifest)).toEqual([120, 195]);
  });
});

describe("asset helpers", () => {
  it("resolves assets relative to manifest + assetsRoot", () => {
    const abs = resolveAssetPath({
      manifestPath: "/proj/video.json",
      assetsRoot: ".",
      relativePath: "assets/audio/a.mp3",
    });
    expect(abs).toBe(path.resolve("/proj/assets/audio/a.mp3"));
  });

  it("resolves component paths relative to the manifest", () => {
    expect(
      resolveComponentPath({
        manifestPath: "/proj/video.json",
        componentPath: "src/scenes/A.tsx",
      }),
    ).toBe(path.resolve("/proj/src/scenes/A.tsx"));
  });

  it("collects unique scene and lead-in component paths", () => {
    const manifest = parseVideoManifest({
      ...base,
      leadIn: { component: "src/Lead.tsx" },
    });
    expect(collectComponentPaths(manifest).sort()).toEqual(
      ["scenes/01.tsx", "scenes/02.tsx", "src/Lead.tsx"].sort(),
    );
  });

  it("reports missing audio assets", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-assets-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(manifestPath, "{}");
    const manifest = parseVideoManifest({
      ...base,
      seriesAudio: {
        leadInSeconds: 1,
        jingle: "missing-jingle.mp3",
        jingleVolume: 0.5,
        bedVolumeUnderVo: 0.1,
        bedVolumeLeadIn: 0.1,
        jingleFadeOutSeconds: 0.2,
        bedFadeInSeconds: 0.2,
        bedFadeOutSeconds: 0.2,
      },
    });
    const errors = assertAssetsExist({ manifest, manifestPath });
    expect(errors.some((e) => e.includes("missing-jingle.mp3"))).toBe(true);
  });
});

describe("validateVideoFile", () => {
  it("accepts a valid on-disk manifest without audio", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-valid-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(manifestPath, JSON.stringify(base));
    const result = validateVideoFile({
      manifestPath,
      checkAssets: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.slug).toBe("test");
  });

  it("rejects missing files", () => {
    const result = validateVideoFile({
      manifestPath: path.join(os.tmpdir(), "does-not-exist-video.json"),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/not found/i);
  });

  it("rejects invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-badjson-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(manifestPath, "{not json");
    const result = validateVideoFile({ manifestPath });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Invalid JSON/);
  });

  it("rejects schema errors", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-schema-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ schemaVersion: 1, slug: "x" }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(false);
  });

  it("rejects unsupported visualType in MVP", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-vtype-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        ...base,
        scenes: [
          {
            ...base.scenes[0],
            visualType: "generated-video",
          },
        ],
      }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("generated-video"))).toBe(
        true,
      );
    }
  });
});
