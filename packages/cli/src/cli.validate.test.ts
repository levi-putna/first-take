import path from "node:path";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const cliPath = path.join(repoRoot, "packages/cli/dist/cli.js");

/**
 * Run the storyboard CLI via spawnSync (avoids execa + jsdom AbortSignal issues).
 */
function runCli({ args }: { args: string[] }) {
  return spawnSync("node", [cliPath, ...args], {
    encoding: "utf8",
    cwd: repoRoot,
  });
}

describe("storyboard CLI validate", () => {
  it("exits 0 for a valid fixture", () => {
    const manifest = path.join(
      repoRoot,
      "examples/solid-frames/video.json",
    );
    const result = runCli({ args: ["validate", manifest, "--no-assets"] });
    expect(result.status).toBe(0);
  });

  it("exits non-zero for missing file", () => {
    const result = runCli({
      args: ["validate", path.join(repoRoot, "examples/nope/video.json")],
    });
    expect(result.status).not.toBe(0);
  });

  it("exits non-zero when assets are missing", () => {
    const tmp = mkdtempSync(path.join(tmpdir(), "cli-val-"));
    const manifestPath = path.join(tmp, "video.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        schemaVersion: 1,
        slug: "bad-audio",
        title: "Bad",
        fps: 30,
        formats: [{ id: "16x9", aspectRatio: "16:9", width: 640, height: 360 }],
        seriesAudio: {
          leadInSeconds: 1,
          jingle: "missing.mp3",
        },
        scenes: [
          {
            id: "01",
            title: "A",
            visualType: "component",
            component: "a.tsx",
            durationInFrames: 10,
          },
        ],
      }),
    );
    const result = runCli({ args: ["validate", manifestPath] });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/Missing asset/i);
  });
});
