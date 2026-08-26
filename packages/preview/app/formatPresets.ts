import type { Format } from "@levi-putna/storyboard-schema";

/**
 * Common output sizes offered when adding a format in the studio.
 */
export const FORMAT_ADD_PRESETS: Format[] = [
  { id: "16x9", aspectRatio: "16:9", width: 1920, height: 1080 },
  { id: "9x16", aspectRatio: "9:16", width: 1080, height: 1920 },
  { id: "1x1", aspectRatio: "1:1", width: 1080, height: 1080 },
  { id: "4x5", aspectRatio: "4:5", width: 1080, height: 1350 },
];

const PRESET_HINTS: Record<string, string> = {
  "16x9": "YouTube, presentations",
  "9x16": "Shorts, Reels, TikTok",
  "1x1": "Feed / square",
  "4x5": "Portrait feed",
};

/**
 * Greatest common divisor for reducing pixel sizes to an aspect ratio.
 */
function gcd({ a, b }: { a: number; b: number }): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

/**
 * Reduce width/height to an `W:H` aspect-ratio label.
 */
export function ratioFromPixels({
  width,
  height,
}: {
  width: number;
  height: number;
}): string {
  const g = gcd({ a: width, b: height });
  return `${width / g}:${height / g}`;
}

/**
 * Human-readable hint for a format id or aspect ratio.
 */
export function formatHint({ format }: { format: Format }): string {
  return PRESET_HINTS[format.id] ?? `${format.width}×${format.height}`;
}

/**
 * Presets not already present on the project (by id or aspect ratio).
 */
export function availableFormatPresets({
  formats,
}: {
  formats: Format[];
}): Format[] {
  const ids = new Set(formats.map((format) => format.id));
  const ratios = new Set(formats.map((format) => format.aspectRatio));
  return FORMAT_ADD_PRESETS.filter(
    (preset) => !ids.has(preset.id) && !ratios.has(preset.aspectRatio),
  );
}
