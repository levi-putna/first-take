/** Transport bar height in pixels. */
export const DOCK_TRANSPORT_HEIGHT = 44;

/** Time ruler height in pixels. */
export const DOCK_RULER_HEIGHT = 28;

/** One timeline lane row height in pixels. */
export const DOCK_LANE_HEIGHT = 32;

/** Resize handle between stage and dock. */
export const DOCK_RESIZE_HANDLE_HEIGHT = 6;

/** Top chrome height (header). */
export const SHELL_HEADER_HEIGHT = 48;

/** Minimum stage height so the preview never collapses. */
export const MIN_STAGE_HEIGHT = 200;

/** Absolute cap on dock height. */
export const DOCK_MAX_HEIGHT = 520;

/** Default dock height: transport + ruler + three lanes. */
export const DOCK_DEFAULT_HEIGHT =
  DOCK_TRANSPORT_HEIGHT + DOCK_RULER_HEIGHT + DOCK_LANE_HEIGHT * 3;

/** Minimum dock height: transport + ruler + one lane. */
export const DOCK_MIN_HEIGHT =
  DOCK_TRANSPORT_HEIGHT + DOCK_RULER_HEIGHT + DOCK_LANE_HEIGHT;

export const DOCK_HEIGHT_STORAGE_KEY = "storyboard-preview-dock-height";

/**
 * Clamp dock height against sensible min/max for the current shell size.
 */
export function clampDockHeight({
  height,
  shellHeight,
}: {
  height: number;
  shellHeight: number;
}): number {
  const maxByViewport =
    shellHeight -
    SHELL_HEADER_HEIGHT -
    MIN_STAGE_HEIGHT -
    DOCK_RESIZE_HANDLE_HEIGHT;
  const max = Math.min(DOCK_MAX_HEIGHT, maxByViewport);
  const safeMax = Math.max(DOCK_MIN_HEIGHT, max);
  return Math.min(Math.max(height, DOCK_MIN_HEIGHT), safeMax);
}

/**
 * Read a persisted dock height from localStorage, if valid.
 */
export function readStoredDockHeight({
  shellHeight,
}: {
  shellHeight: number;
}): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DOCK_HEIGHT_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  return clampDockHeight({ height: parsed, shellHeight });
}
