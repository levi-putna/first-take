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
  schemaVersion: 3 as const,
  slug: "test",
  title: "Test",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 1920, height: 1080 }],
  tracks: [
    {
      id: "main",
      scenes: [
        {
          id: "01",
          title: "Hook",
          visualType: "component" as const,
          component: "scenes/01.tsx",
          durationInFrames: 90,
        },
        {
          id: "02",
          title: "Fix",
          visualType: "component" as const,
          component: "scenes/02.tsx",
          durationInFrames: 120,
        },
      ],
    },
  ],
};

describe("sceneStartFrames", () => {
  it("lists scene start frames on a single track", () => {
    const manifest = parseVideoManifest(base);
    expect(sceneStartFrames(manifest)).toEqual([0, 90]);
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

  it("collects unique scene component paths across tracks", () => {
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        ...base.tracks,
        {
          id: "bed",
          scenes: [
            {
              id: "bed",
              title: "Bed",
              visualType: "component" as const,
              component: "src/scenes/Bed.tsx",
              durationInFrames: 90,
            },
          ],
        },
      ],
    });
    expect(collectComponentPaths(manifest).sort()).toEqual(
      ["scenes/01.tsx", "scenes/02.tsx", "src/scenes/Bed.tsx"].sort(),
    );
  });

  it("reports missing audio assets from scene props", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-assets-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(manifestPath, "{}");
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        {
          id: "main",
          scenes: [
            {
              ...base.tracks[0].scenes[0],
              props: { bed: "missing-bed.mp3" },
            },
          ],
        },
      ],
    });
    const errors = assertAssetsExist({ manifest, manifestPath });
    expect(errors.some((e) => e.includes("missing-bed.mp3"))).toBe(true);
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
      JSON.stringify({ schemaVersion: 3, slug: "x" }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(false);
  });

  it("rejects schemaVersion 2 manifests", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-v2-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ ...base, schemaVersion: 2 }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("schemaVersion 2"))).toBe(
        true,
      );
    }
  });

  it("rejects transitionIn on scenes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-trans-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        ...base,
        tracks: [
          {
            id: "main",
            scenes: [
              {
                ...base.tracks[0].scenes[0],
                transitionIn: { type: "fade", durationInFrames: 10 },
              },
            ],
          },
        ],
      }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("transitionIn"))).toBe(true);
    }
  });

  it("accepts empty tracks when another track has scenes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-empty-track-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        ...base,
        tracks: [
          base.tracks[0],
          {
            id: "overlay",
            title: "Overlay",
            description: "Lower thirds and badges",
            scenes: [],
          },
        ],
      }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(true);
  });

  it("rejects manifests where every track is empty", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-all-empty-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        ...base,
        tracks: [{ id: "empty", title: "Empty", scenes: [] }],
      }),
    );
    const result = validateVideoFile({ manifestPath, checkAssets: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("At least one track"))).toBe(
        true,
      );
    }
  });

  it("rejects unsupported visualType in MVP", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-vtype-"));
    const manifestPath = path.join(dir, "video.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        ...base,
        tracks: [
          {
            id: "main",
            scenes: [
              {
                ...base.tracks[0].scenes[0],
                visualType: "generated-video",
              },
            ],
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
