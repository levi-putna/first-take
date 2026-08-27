import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  discoverPreviewProjects,
  isAllowedPreviewProject,
  readPreviewProject,
  sameManifestPath,
} from "./discover-projects.js";
import { resolvePublicAssetPath } from "./serve-assets.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const minimalManifest = {
  schemaVersion: 3,
  slug: "solo",
  title: "Solo Video",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 640, height: 360 }],
  tracks: [
    {
      id: "main",
      scenes: [
        {
          id: "01",
          title: "Hold",
          visualType: "component",
          component: "src/A.tsx",
          durationInFrames: 10,
        },
      ],
    },
  ],
};

/**
 * Write a minimal video.json for discovery tests.
 */
function writeManifest({
  dir,
  slug,
  title,
}: {
  dir: string;
  slug: string;
  title: string;
}): string {
  fs.mkdirSync(dir, { recursive: true });
  const manifestPath = path.join(dir, "video.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ ...minimalManifest, slug, title }),
  );
  return manifestPath;
}

describe("discoverPreviewProjects", () => {
  it("finds sibling examples next to hello-explainer", () => {
    const projects = discoverPreviewProjects({
      manifestPath: path.join(repoRoot, "examples/hello-explainer/video.json"),
      cwd: repoRoot,
    });
    expect(projects.length).toBeGreaterThan(1);
    expect(projects.some((project) => project.slug === "hello-explainer")).toBe(
      true,
    );
    expect(projects.some((project) => project.slug === "motion-lab")).toBe(true);
  });

  it("returns a single project when there are no neighbours", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sb-preview-solo-"));
    const manifestPath = writeManifest({
      dir: path.join(root, "only-video"),
      slug: "solo",
      title: "Solo Video",
    });
    const isolatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), "sb-preview-cwd-"));
    const projects = discoverPreviewProjects({
      manifestPath,
      cwd: isolatedCwd,
    });
    expect(projects).toHaveLength(1);
    expect(projects[0]?.title).toBe("Solo Video");
  });

  it("lists sibling videos under the same parent folder", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sb-preview-sib-"));
    const alpha = writeManifest({
      dir: path.join(root, "alpha"),
      slug: "alpha",
      title: "Alpha",
    });
    writeManifest({
      dir: path.join(root, "beta"),
      slug: "beta",
      title: "Beta",
    });
    const isolatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), "sb-preview-cwd-"));
    const projects = discoverPreviewProjects({
      manifestPath: alpha,
      cwd: isolatedCwd,
    });
    expect(projects.map((project) => project.slug).sort()).toEqual([
      "alpha",
      "beta",
    ]);
  });
});

describe("isAllowedPreviewProject", () => {
  it("allows a discovered sibling and rejects an unrelated path", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sb-preview-allow-"));
    const alpha = writeManifest({
      dir: path.join(root, "alpha"),
      slug: "alpha",
      title: "Alpha",
    });
    const beta = writeManifest({
      dir: path.join(root, "beta"),
      slug: "beta",
      title: "Beta",
    });
    const outsider = writeManifest({
      dir: path.join(root, "other-cluster", "gamma"),
      slug: "gamma",
      title: "Gamma",
    });
    const isolatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), "sb-preview-cwd-"));
    expect(
      isAllowedPreviewProject({
        candidatePath: beta,
        currentManifestPath: alpha,
        cwd: isolatedCwd,
      }),
    ).toBe(true);
    expect(
      isAllowedPreviewProject({
        candidatePath: outsider,
        currentManifestPath: alpha,
        cwd: isolatedCwd,
      }),
    ).toBe(false);
  });
});

describe("readPreviewProject", () => {
  it("returns null for missing files", () => {
    expect(
      readPreviewProject({
        manifestPath: path.join(os.tmpdir(), "no-such-video.json"),
      }),
    ).toBeNull();
  });
});

describe("sameManifestPath", () => {
  it("treats resolved paths as equal", () => {
    const file = path.join(repoRoot, "examples/hello-explainer/video.json");
    expect(
      sameManifestPath({
        left: file,
        right: path.join(repoRoot, "examples/hello-explainer", ".", "video.json"),
      }),
    ).toBe(true);
  });
});

describe("resolvePublicAssetPath", () => {
  it("resolves files under the assets root and rejects traversal", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sb-assets-"));
    const audio = path.join(root, "assets", "audio");
    fs.mkdirSync(audio, { recursive: true });
    const file = path.join(audio, "bed.mp3");
    fs.writeFileSync(file, "x");
    expect(
      resolvePublicAssetPath({
        assetsRoot: root,
        requestUrl: "/assets/audio/bed.mp3",
      }),
    ).toBe(file);
    expect(
      resolvePublicAssetPath({
        assetsRoot: root,
        requestUrl: "/assets/audio/../audio/bed.mp3",
      }),
    ).toBe(file);
    expect(
      resolvePublicAssetPath({
        assetsRoot: root,
        requestUrl: "/../../etc/passwd",
      }),
    ).toBeNull();
    expect(
      resolvePublicAssetPath({
        assetsRoot: root,
        requestUrl: "/@vite/client",
      }),
    ).toBeNull();
  });
});
