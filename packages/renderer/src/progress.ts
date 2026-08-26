/**
 * Progress and logging hooks for the render pipeline.
 * The renderer stays quiet unless the CLI (or tests) supply handlers.
 */

export type RenderPhase =
  | "bundling"
  | "extracting"
  | "capturing"
  | "encoding"
  | "done";

/**
 * A single progress update from renderMedia / capture / encode.
 */
export type RenderProgressEvent = {
  phase: RenderPhase;
  /** Human-readable status for verbose / status lines. */
  message?: string;
  /** Completed units in the current phase (e.g. frames captured). */
  current?: number;
  /** Total units in the current phase when known. */
  total?: number;
};

/**
 * Optional observability for renderMedia / renderStill.
 */
export type RenderObservers = {
  /** When true, subprocesses (FFmpeg) may stream to the terminal. */
  verbose?: boolean;
  /** Phase / frame progress. Called frequently during capture. */
  onProgress?: (event: RenderProgressEvent) => void;
  /** Non-fatal issues (e.g. skipped audio inputs). */
  onWarn?: (message: string) => void;
};

/**
 * Emit a progress event when a handler is present.
 */
export function emitProgress({
  onProgress,
  event,
}: {
  onProgress?: (event: RenderProgressEvent) => void;
  event: RenderProgressEvent;
}): void {
  onProgress?.(event);
}

/**
 * Emit a warning when a handler is present; otherwise no-op (library-quiet).
 */
export function emitWarn({
  onWarn,
  message,
}: {
  onWarn?: (message: string) => void;
  message: string;
}): void {
  onWarn?.(message);
}
