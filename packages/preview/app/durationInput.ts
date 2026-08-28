/**
 * Time-based duration editing: authors type seconds, storage is whole frames at fps.
 */

const MAX_SECONDS_DECIMALS = 6;

/**
 * Snap a duration in seconds to a whole-frame count at the given frame rate.
 */
export function secondsToFrames({
  seconds,
  fps,
}: {
  seconds: number;
  fps: number;
}): number {
  const safeFps = Math.max(1, fps);
  if (!Number.isFinite(seconds) || seconds <= 0) return 1;
  return Math.max(1, Math.round(seconds * safeFps));
}

/**
 * Format a frame count as seconds that round-trip through {@link secondsToFrames}.
 */
export function formatDurationSeconds({
  frames,
  fps,
}: {
  frames: number;
  fps: number;
}): string {
  const safeFps = Math.max(1, fps);
  const safeFrames = Math.max(1, Math.round(frames));
  const seconds = safeFrames / safeFps;

  for (let decimals = 0; decimals <= MAX_SECONDS_DECIMALS; decimals++) {
    const text = seconds.toFixed(decimals);
    const stripped =
      decimals === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
    if (secondsToFrames({ seconds: Number(stripped), fps: safeFps }) === safeFrames) {
      return stripped;
    }
    if (secondsToFrames({ seconds: Number(text), fps: safeFps }) === safeFrames) {
      return text;
    }
  }

  return String(seconds);
}

export type ParseDurationResult =
  | { ok: true; frames: number }
  | { ok: false };

/**
 * Parse a time-only duration string and snap it to whole frames.
 *
 * Accepts seconds (`4`, `3.5`, `4s`) and `m:ss` / `m:ss.frac`.
 * Rejects frame counts and timecode-with-frames so the input stays time-based.
 */
export function parseDurationInput({
  text,
  fps,
}: {
  text: string;
  fps: number;
}): ParseDurationResult {
  const raw = text.trim();
  if (!raw) return { ok: false };

  // Frame counts and NLE timecode belong in the readout, not the input.
  if (/^\d+(\.\d+)?\s*f$/i.test(raw)) return { ok: false };
  if ((raw.match(/:/g) ?? []).length >= 2) return { ok: false };

  const withoutUnit = raw.replace(/\s*(seconds|secs|sec|s)$/i, "").trim();
  if (!withoutUnit) return { ok: false };

  if (withoutUnit.includes(":")) {
    return parseMinutesAndSeconds({ text: withoutUnit, fps });
  }

  const seconds = Number(withoutUnit);
  if (!Number.isFinite(seconds) || seconds < 0) return { ok: false };

  return { ok: true, frames: secondsToFrames({ seconds, fps }) };
}

/**
 * Clamp a requested frame duration to the legal trim range.
 */
export function clampDurationInFrames({
  durationInFrames,
  maxDurationInFrames,
}: {
  durationInFrames: number;
  maxDurationInFrames?: number | null;
}): number {
  const requested = Math.max(1, Math.round(durationInFrames));
  if (maxDurationInFrames == null || !Number.isFinite(maxDurationInFrames)) {
    return requested;
  }
  return Math.max(1, Math.min(requested, Math.round(maxDurationInFrames)));
}

/**
 * Parse `m:ss` or `m:ss.frac` as a time duration.
 */
function parseMinutesAndSeconds({
  text,
  fps,
}: {
  text: string;
  fps: number;
}): ParseDurationResult {
  const parts = text.split(":");
  if (parts.length !== 2) return { ok: false };

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    minutes < 0 ||
    seconds < 0 ||
    seconds >= 60
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    frames: secondsToFrames({ seconds: minutes * 60 + seconds, fps }),
  };
}
