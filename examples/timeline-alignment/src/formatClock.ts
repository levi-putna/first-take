/**
 * Format a whole-second offset from composition start as `m:ss`.
 */
export function formatClock({ totalSeconds }: { totalSeconds: number }): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
