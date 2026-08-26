import { consola } from "consola";

/**
 * Progress event shape mirrored from @storyboard/renderer (keep in sync).
 */
type ProgressEvent = {
  phase: "bundling" | "extracting" | "capturing" | "encoding" | "done";
  message?: string;
  current?: number;
  total?: number;
};

/**
 * CLI-facing progress reporter: quiet by default, detailed when verbose.
 *
 * Default UX:
 * - Phase labels (Bundling… / Encoding…)
 * - In-place capture progress on TTYs
 * - Warnings and errors always visible
 * - `--verbose` adds FFmpeg + every progress event
 */
export function createCliProgress({
  verbose = false,
}: {
  verbose?: boolean;
} = {}) {
  let lastPhase: ProgressEvent["phase"] | null = null;
  let lastWriteMs = 0;
  let captureLineOpen = false;

  /**
   * Clear an in-place capture progress line before printing something else.
   */
  function clearCaptureLine(): void {
    if (!captureLineOpen) return;
    if (process.stdout.isTTY) {
      process.stdout.write("\r\x1b[2K");
    } else {
      process.stdout.write("\n");
    }
    captureLineOpen = false;
  }

  /**
   * Handle a progress event from the renderer.
   */
  function onProgress(event: ProgressEvent): void {
    if (verbose) {
      // Phase transitions + throttled capture — not every frame
      if (event.phase === "capturing" && event.current != null && event.total != null) {
        const now = Date.now();
        const isFirst = event.current === 0;
        const isLast = event.current >= event.total;
        const stepped =
          event.total > 0 &&
          event.current > 0 &&
          event.current % Math.max(1, Math.floor(event.total / 10)) === 0;
        if (!isFirst && !isLast && !stepped && now - lastWriteMs < 500) return;
        lastWriteMs = now;
      } else if (event.phase === lastPhase && event.phase !== "done") {
        return;
      }
      lastPhase = event.phase;
      const parts = [event.message ?? event.phase];
      if (event.current != null && event.total != null) {
        parts.push(`${event.current}/${event.total}`);
      }
      consola.info(parts.join(" · "));
      return;
    }

    if (
      event.phase === "capturing" &&
      event.current != null &&
      event.total != null
    ) {
      // Skip the initial 0/N tick — wait for real progress
      if (event.current === 0) {
        lastPhase = "capturing";
        return;
      }
      const now = Date.now();
      const isLast = event.current >= event.total;
      if (!isLast && now - lastWriteMs < 100) return;
      lastWriteMs = now;
      lastPhase = "capturing";
      const pct =
        event.total > 0 ? Math.floor((event.current / event.total) * 100) : 0;
      const line = `  Capturing frames  ${event.current}/${event.total}  (${pct}%)`;
      if (process.stdout.isTTY) {
        process.stdout.write(`\r${line}\x1b[K`);
        captureLineOpen = true;
      } else if (isLast || event.current === 1 || event.current % 30 === 0) {
        process.stdout.write(`${line}\n`);
      }
      return;
    }

    if (event.phase === lastPhase && event.phase !== "done") return;
    clearCaptureLine();
    lastPhase = event.phase;

    switch (event.phase) {
      case "bundling":
        consola.info("Bundling…");
        break;
      case "extracting":
        consola.info(event.message ?? "Extracting clips…");
        break;
      case "encoding":
        consola.info("Encoding…");
        break;
      default:
        break;
    }
  }

  /**
   * Always surface warnings.
   */
  function onWarn(message: string): void {
    clearCaptureLine();
    consola.warn(message);
  }

  /**
   * Finish in-place progress before a success/error line.
   */
  function finish(): void {
    clearCaptureLine();
    lastPhase = null;
  }

  return { onProgress, onWarn, finish, verbose };
}
