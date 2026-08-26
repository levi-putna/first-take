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

/**
 * Floored m:ss (or h:mm:ss) for ruler ticks.
 */
export function formatFlooredTimecode({
  frame,
  fps,
}: {
  frame: number;
  fps: number;
}): string {
  if (!Number.isFinite(frame) || !Number.isFinite(fps) || fps <= 0) {
    return "0:00";
  }
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
