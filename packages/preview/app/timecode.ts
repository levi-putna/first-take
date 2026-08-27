/**
 * Format an integer frame as mm:ss:ff at the given fps.
 */
export function formatTimecode({
  frame,
  fps,
}: {
  frame: number;
  fps: number;
}): string {
  const safeFps = Math.max(1, fps);
  const totalSeconds = Math.max(0, Math.floor(frame / safeFps));
  const frames = Math.max(0, Math.floor(frame % safeFps));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Compact seconds label (e.g. 2.8s).
 */
export function formatSeconds({
  seconds,
}: {
  seconds: number;
}): string {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}s` : `${rounded.toFixed(1)}s`;
}

/** Finest ruler label precision (milliseconds-ish). */
export const MAX_RULER_DECIMALS = 3;

/**
 * Smallest decimal places (0–3) so consecutive ticks stay unique and the
 * labelled interval matches the real step. One decimal is enough for 0.5s;
 * 0.167s steps use two (`0.17`) rather than uneven `0.2` / `0.3`; 0.025s
 * steps use three so they do not round to a shared 0.03 / 0.02.
 */
export function rulerDecimalPlaces({
  stepFrames,
  fps,
}: {
  stepFrames: number;
  fps: number;
}): number {
  const stepSeconds = Math.max(0, stepFrames) / Math.max(1, fps);
  if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) return 0;

  for (let decimals = 0; decimals <= MAX_RULER_DECIMALS; decimals++) {
    if (labelsCollide({ stepSeconds, decimals })) continue;
    if (labelledStepsTooUneven({ stepSeconds, decimals })) continue;
    return decimals;
  }
  return MAX_RULER_DECIMALS;
}

/**
 * Smallest decimal places so every frame in `frames` formats to a unique label.
 */
export function decimalsForTickFrames({
  frames,
  fps,
}: {
  frames: number[];
  fps: number;
}): number {
  const stepFrames =
    frames.length >= 2 ? Math.max(1, frames[1]! - frames[0]!) : 0;
  let decimals = rulerDecimalPlaces({ stepFrames, fps });

  for (; decimals <= MAX_RULER_DECIMALS; decimals++) {
    const seen = new Set<string>();
    let unique = true;
    for (const frame of frames) {
      const label = formatFlooredTimecode({ frame, fps, decimals });
      if (seen.has(label)) {
        unique = false;
        break;
      }
      seen.add(label);
    }
    if (unique) return decimals;
  }
  return MAX_RULER_DECIMALS;
}

/**
 * Ruler tick label. Whole-second steps stay `m:ss` / `h:mm:ss`.
 * Sub-second steps use the fewest decimals that keep neighbouring ticks unique.
 */
export function formatFlooredTimecode({
  frame,
  fps,
  stepFrames,
  decimals,
}: {
  frame: number;
  fps: number;
  stepFrames?: number;
  decimals?: number;
}): string {
  if (!Number.isFinite(frame) || !Number.isFinite(fps) || fps <= 0) {
    return "0:00";
  }

  const places =
    decimals !== undefined
      ? clampDecimals(decimals)
      : stepFrames !== undefined
        ? rulerDecimalPlaces({ stepFrames, fps })
        : 0;

  if (places === 0) {
    return formatWholeSeconds({ frame, fps });
  }

  return formatFractionalSeconds({ frame, fps, decimals: places });
}

/**
 * Major ruler step in frames for a fit-all timeline.
 */
export function majorRulerStepFrames({
  durationInFrames,
  fps,
}: {
  durationInFrames: number;
  fps: number;
}): number {
  const seconds = durationInFrames / Math.max(1, fps);
  if (seconds <= 2) return Math.max(1, Math.round(fps / 2));
  if (seconds <= 15) return Math.max(1, Math.round(fps));
  if (seconds <= 60) return Math.max(1, Math.round(fps * 5));
  return Math.max(1, Math.round(fps * 10));
}

/**
 * Clamp requested decimal places into the supported 0–3 range.
 */
function clampDecimals(decimals: number): number {
  if (!Number.isFinite(decimals)) return 0;
  return Math.min(MAX_RULER_DECIMALS, Math.max(0, Math.round(decimals)));
}

/**
 * Whole-second ruler label (m:ss or h:mm:ss).
 */
function formatWholeSeconds({
  frame,
  fps,
}: {
  frame: number;
  fps: number;
}): string {
  const totalSeconds = Math.max(0, Math.floor(frame / fps));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const sec = seconds.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${sec}`;
  }
  return `${minutes}:${sec}`;
}

/**
 * Sub-second ruler label, e.g. 0.2, 0.17, 0.025, 1:05.025.
 */
function formatFractionalSeconds({
  frame,
  fps,
  decimals,
}: {
  frame: number;
  fps: number;
  decimals: number;
}): string {
  const factor = 10 ** decimals;
  const roundedUnits = Math.round(Math.max(0, frame / fps) * factor);
  const hours = Math.floor(roundedUnits / (3600 * factor));
  const minutes = Math.floor(roundedUnits / (60 * factor)) % 60;
  const secondUnits = roundedUnits % (60 * factor);
  const secWhole = Math.floor(secondUnits / factor);
  const frac = secondUnits % factor;
  const fracStr = String(frac).padStart(decimals, "0");

  if (hours > 0) {
    const min = minutes.toString().padStart(2, "0");
    const sec = secWhole.toString().padStart(2, "0");
    return `${hours}:${min}:${sec}.${fracStr}`;
  }
  if (minutes > 0) {
    const sec = secWhole.toString().padStart(2, "0");
    return `${minutes}:${sec}.${fracStr}`;
  }
  return `${secWhole}.${fracStr}`;
}

/**
 * True when consecutive ticks round to the same label at this precision.
 */
function labelsCollide({
  stepSeconds,
  decimals,
}: {
  stepSeconds: number;
  decimals: number;
}): boolean {
  const factor = 10 ** decimals;
  const tickCount = Math.min(128, Math.max(4, Math.ceil(4 / stepSeconds) + 2));
  const seen = new Set<number>();
  for (let i = 0; i < tickCount; i++) {
    const rounded = Math.round(i * stepSeconds * factor);
    if (seen.has(rounded)) return true;
    seen.add(rounded);
  }
  return false;
}

/**
 * True when rounded tick gaps vary too much, e.g. 0.2 then 0.1 for a 0.167s step.
 */
function labelledStepsTooUneven({
  stepSeconds,
  decimals,
}: {
  stepSeconds: number;
  decimals: number;
}): boolean {
  if (decimals === 0) return stepSeconds < 1;
  const factor = 10 ** decimals;
  let minDelta = Infinity;
  let maxDelta = 0;
  const tickCount = Math.min(24, Math.max(4, Math.ceil(2 / stepSeconds)));
  for (let i = 0; i < tickCount; i++) {
    const from = Math.round(i * stepSeconds * factor);
    const to = Math.round((i + 1) * stepSeconds * factor);
    const delta = to - from;
    minDelta = Math.min(minDelta, delta);
    maxDelta = Math.max(maxDelta, delta);
  }
  return (maxDelta - minDelta) / Math.max(1, maxDelta) > 0.15;
}
