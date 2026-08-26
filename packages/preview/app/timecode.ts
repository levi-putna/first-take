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
 * Compact seconds label for audio windows (e.g. 2.8s).
 */
export function formatSeconds({
  seconds,
}: {
  seconds: number;
}): string {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}s` : `${rounded.toFixed(1)}s`;
}
