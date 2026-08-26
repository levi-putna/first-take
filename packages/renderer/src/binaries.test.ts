import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  getFfmpegPath,
  getFfprobePath,
  resolveBinaryPath,
} from "./binaries.js";

/**
 * Spawn a binary with spawnSync (avoids execa + jsdom AbortSignal issues).
 */
function runBinary({
  binary,
  args,
}: {
  binary: string;
  args: string[];
}) {
  return spawnSync(binary, args, { encoding: "utf8" });
}

describe("resolveBinaryPath", () => {
  it("prefers an explicit path over env and packaged binaries", () => {
    expect(
      resolveBinaryPath({
        fallbackName: "ffmpeg",
        explicitPath: "/opt/custom/ffmpeg",
        envValue: "/env/ffmpeg",
        packagedPath: "/pkg/ffmpeg",
      }),
    ).toBe("/opt/custom/ffmpeg");
  });

  it("prefers env over the packaged binary", () => {
    expect(
      resolveBinaryPath({
        fallbackName: "ffmpeg",
        envValue: "/env/ffmpeg",
        packagedPath: "/pkg/ffmpeg",
      }),
    ).toBe("/env/ffmpeg");
  });

  it("uses the packaged binary when no override is set", () => {
    expect(
      resolveBinaryPath({
        fallbackName: "ffmpeg",
        packagedPath: "/pkg/ffmpeg",
      }),
    ).toBe("/pkg/ffmpeg");
  });

  it("falls back to the command name on PATH", () => {
    expect(
      resolveBinaryPath({
        fallbackName: "ffprobe",
      }),
    ).toBe("ffprobe");
  });

  it("ignores blank explicit, env, and packaged values", () => {
    expect(
      resolveBinaryPath({
        fallbackName: "ffmpeg",
        explicitPath: "  ",
        envValue: "",
        packagedPath: null,
      }),
    ).toBe("ffmpeg");
  });
});

describe("packaged ffmpeg binaries", () => {
  it("honours an explicit ffmpegPath over the packaged binary", () => {
    expect(getFfmpegPath({ ffmpegPath: "/tmp/custom-ffmpeg" })).toBe(
      "/tmp/custom-ffmpeg",
    );
  });

  it("resolves an on-disk ffmpeg binary without using PATH", () => {
    const previous = process.env.STORYBOARD_FFMPEG;
    delete process.env.STORYBOARD_FFMPEG;
    try {
      const resolved = getFfmpegPath();
      expect(resolved).not.toBe("ffmpeg");
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(fs.existsSync(resolved)).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.STORYBOARD_FFMPEG;
      } else {
        process.env.STORYBOARD_FFMPEG = previous;
      }
    }
  });

  it("resolves an on-disk ffprobe binary without using PATH", () => {
    const previous = process.env.STORYBOARD_FFPROBE;
    delete process.env.STORYBOARD_FFPROBE;
    try {
      const resolved = getFfprobePath();
      expect(resolved).not.toBe("ffprobe");
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(fs.existsSync(resolved)).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.STORYBOARD_FFPROBE;
      } else {
        process.env.STORYBOARD_FFPROBE = previous;
      }
    }
  });

  it("runs ffmpeg -version and includes libx264", () => {
    const previous = process.env.STORYBOARD_FFMPEG;
    delete process.env.STORYBOARD_FFMPEG;
    try {
      const version = runBinary({
        binary: getFfmpegPath(),
        args: ["-version"],
      });
      expect(version.status).toBe(0);
      expect(`${version.stdout}${version.stderr}`).toMatch(/ffmpeg version/i);
      const encoders = runBinary({
        binary: getFfmpegPath(),
        args: ["-encoders"],
      });
      expect(encoders.status).toBe(0);
      expect(`${encoders.stdout}${encoders.stderr}`).toMatch(/libx264/);
    } finally {
      if (previous === undefined) {
        delete process.env.STORYBOARD_FFMPEG;
      } else {
        process.env.STORYBOARD_FFMPEG = previous;
      }
    }
  });

  it("runs ffprobe -version", () => {
    const previous = process.env.STORYBOARD_FFPROBE;
    delete process.env.STORYBOARD_FFPROBE;
    try {
      const version = runBinary({
        binary: getFfprobePath(),
        args: ["-version"],
      });
      expect(version.status).toBe(0);
      expect(`${version.stdout}${version.stderr}`).toMatch(/ffprobe version/i);
    } finally {
      if (previous === undefined) {
        delete process.env.STORYBOARD_FFPROBE;
      } else {
        process.env.STORYBOARD_FFPROBE = previous;
      }
    }
  });
});
