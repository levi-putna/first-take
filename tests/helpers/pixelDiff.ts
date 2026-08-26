import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export type PixelDiffResult = {
  width: number;
  height: number;
  diffPixels: number;
  totalPixels: number;
  percentDiffering: number;
  passed: boolean;
};

export type PixelDiffOptions = {
  /** Per-pixel colour distance threshold (0–1). Default 0.1. */
  threshold?: number;
  /** Max fraction of differing pixels allowed (0–1). Default 0.005 (0.5%). */
  maxDifferingFraction?: number;
  /** Optional path to write a red-highlight diff PNG on failure. */
  diffOutputPath?: string;
};

/**
 * Compare two PNG files with pixelmatch.
 */
export function comparePngFiles({
  actualPath,
  expectedPath,
  threshold = 0.1,
  maxDifferingFraction = 0.005,
  diffOutputPath,
}: {
  actualPath: string;
  expectedPath: string;
} & PixelDiffOptions): PixelDiffResult {
  const actual = PNG.sync.read(fs.readFileSync(actualPath));
  const expected = PNG.sync.read(fs.readFileSync(expectedPath));

  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(
      `Dimension mismatch: actual ${actual.width}x${actual.height} vs expected ${expected.width}x${expected.height}`,
    );
  }

  const { width, height } = actual;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    actual.data,
    expected.data,
    diff.data,
    width,
    height,
    { threshold },
  );
  const totalPixels = width * height;
  const percentDiffering = (diffPixels / totalPixels) * 100;
  const passed = diffPixels / totalPixels <= maxDifferingFraction;

  if (!passed && diffOutputPath) {
    fs.mkdirSync(path.dirname(diffOutputPath), { recursive: true });
    fs.writeFileSync(diffOutputPath, PNG.sync.write(diff));
  }

  return {
    width,
    height,
    diffPixels,
    totalPixels,
    percentDiffering,
    passed,
  };
}
