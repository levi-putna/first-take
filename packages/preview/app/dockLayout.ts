/** Transport bar height in pixels. */
export const DOCK_TRANSPORT_HEIGHT = 44;

/** Time ruler height in pixels. */
export const DOCK_RULER_HEIGHT = 28;

/** One timeline lane row height in pixels. */
export const DOCK_LANE_HEIGHT = 32;

/** Visual height of the dock resize separator (1px border). */
export const DOCK_RESIZE_HANDLE_HEIGHT = 1;

/** Default sidebar width in pixels. */
export const SIDEBAR_DEFAULT_WIDTH = 280;

/** Minimum sidebar width so labels and props stay readable. */
export const SIDEBAR_MIN_WIDTH = 200;

/** Absolute cap on sidebar width. */
export const SIDEBAR_MAX_WIDTH = 480;

/** Minimum stage width so the preview never collapses. */
export const MIN_STAGE_WIDTH = 320;

export const SIDEBAR_WIDTH_STORAGE_KEY = "storyboard-preview-sidebar-width";

/** Default track-name column width in pixels. */
export const LABEL_COLUMN_DEFAULT_WIDTH = 96;

/** Extra column width reserved for the track reorder grip. */
export const LABEL_COLUMN_REORDER_EXTRA = 16;

/** Minimum track-name column so truncated titles stay readable. */
export const LABEL_COLUMN_MIN_WIDTH = 72;

/** Absolute cap so the clip track stays the main surface. */
export const LABEL_COLUMN_MAX_WIDTH = 240;

/** Keyboard step when resizing the track-name column. */
export const LABEL_COLUMN_KEYBOARD_STEP = 8;

/** Minimum remaining width for the clip scrollport. */
export const MIN_TIMELINE_TRACK_WIDTH = 200;

export const LABEL_COLUMN_WIDTH_STORAGE_KEY =
  "storyboard-preview-label-column-width";

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

/**
 * Clamp sidebar width against sensible min/max for the current shell size.
 */
export function clampSidebarWidth({
  width,
  shellWidth,
}: {
  width: number;
  shellWidth: number;
}): number {
  const maxByViewport = shellWidth - MIN_STAGE_WIDTH;
  const max = Math.min(SIDEBAR_MAX_WIDTH, maxByViewport);
  const safeMax = Math.max(SIDEBAR_MIN_WIDTH, max);
  return Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), safeMax);
}

/**
 * Read a persisted sidebar width from localStorage, if valid.
 */
export function readStoredSidebarWidth({
  shellWidth,
}: {
  shellWidth: number;
}): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  return clampSidebarWidth({ width: parsed, shellWidth });
}

/**
 * Minimum track-name column width, including the reorder grip when shown.
 */
export function labelColumnMinWidth({
  canReorderTracks,
}: {
  canReorderTracks: boolean;
}): number {
  return (
    LABEL_COLUMN_MIN_WIDTH + (canReorderTracks ? LABEL_COLUMN_REORDER_EXTRA : 0)
  );
}

/**
 * Default track-name column width, including the reorder grip when shown.
 */
export function labelColumnDefaultWidth({
  canReorderTracks,
}: {
  canReorderTracks: boolean;
}): number {
  return (
    LABEL_COLUMN_DEFAULT_WIDTH +
    (canReorderTracks ? LABEL_COLUMN_REORDER_EXTRA : 0)
  );
}

/**
 * Clamp the track-name column against logical min/max and remaining clip space.
 */
export function clampLabelColumnWidth({
  width,
  panelWidth,
  canReorderTracks,
}: {
  width: number;
  panelWidth: number;
  canReorderTracks: boolean;
}): number {
  const min = labelColumnMinWidth({ canReorderTracks });
  const maxByPanel =
    panelWidth > 0
      ? panelWidth - MIN_TIMELINE_TRACK_WIDTH
      : LABEL_COLUMN_MAX_WIDTH;
  const max = Math.min(LABEL_COLUMN_MAX_WIDTH, maxByPanel);
  const safeMax = Math.max(min, max);
  return Math.min(Math.max(width, min), safeMax);
}

/**
 * Read a persisted track-name column width from localStorage, if valid.
 */
export function readStoredLabelColumnWidth(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LABEL_COLUMN_WIDTH_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

/**
 * Persist the track-name column width so it survives reloads.
 */
export function persistLabelColumnWidth({ width }: { width: number }): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LABEL_COLUMN_WIDTH_STORAGE_KEY, String(width));
}
