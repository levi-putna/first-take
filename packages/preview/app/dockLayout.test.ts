import { describe, expect, it } from "vitest";
import {
  clampLabelColumnWidth,
  LABEL_COLUMN_DEFAULT_WIDTH,
  LABEL_COLUMN_MAX_WIDTH,
  LABEL_COLUMN_MIN_WIDTH,
  LABEL_COLUMN_REORDER_EXTRA,
  labelColumnDefaultWidth,
  labelColumnMinWidth,
  MIN_TIMELINE_TRACK_WIDTH,
} from "./dockLayout.js";

describe("labelColumnMinWidth", () => {
  it("uses the readable-name floor without a reorder grip", () => {
    expect(labelColumnMinWidth({ canReorderTracks: false })).toBe(
      LABEL_COLUMN_MIN_WIDTH,
    );
  });

  it("reserves extra space for the reorder grip", () => {
    expect(labelColumnMinWidth({ canReorderTracks: true })).toBe(
      LABEL_COLUMN_MIN_WIDTH + LABEL_COLUMN_REORDER_EXTRA,
    );
  });
});

describe("labelColumnDefaultWidth", () => {
  it("matches the current compact column without a grip", () => {
    expect(labelColumnDefaultWidth({ canReorderTracks: false })).toBe(
      LABEL_COLUMN_DEFAULT_WIDTH,
    );
  });

  it("widens by the grip allowance when tracks can be reordered", () => {
    expect(labelColumnDefaultWidth({ canReorderTracks: true })).toBe(
      LABEL_COLUMN_DEFAULT_WIDTH + LABEL_COLUMN_REORDER_EXTRA,
    );
  });
});

describe("clampLabelColumnWidth", () => {
  it("clamps below the minimum up to the readable floor", () => {
    expect(
      clampLabelColumnWidth({
        width: 20,
        panelWidth: 800,
        canReorderTracks: false,
      }),
    ).toBe(LABEL_COLUMN_MIN_WIDTH);
  });

  it("clamps above the logical maximum", () => {
    expect(
      clampLabelColumnWidth({
        width: 400,
        panelWidth: 800,
        canReorderTracks: false,
      }),
    ).toBe(LABEL_COLUMN_MAX_WIDTH);
  });

  it("raises the floor when the reorder grip is showing", () => {
    expect(
      clampLabelColumnWidth({
        width: LABEL_COLUMN_MIN_WIDTH,
        panelWidth: 800,
        canReorderTracks: true,
      }),
    ).toBe(LABEL_COLUMN_MIN_WIDTH + LABEL_COLUMN_REORDER_EXTRA);
  });

  it("leaves room for the clip track on a narrow panel", () => {
    const panelWidth = MIN_TIMELINE_TRACK_WIDTH + 120;
    expect(
      clampLabelColumnWidth({
        width: LABEL_COLUMN_MAX_WIDTH,
        panelWidth,
        canReorderTracks: false,
      }),
    ).toBe(120);
  });

  it("stays at the minimum when the panel cannot fit the logical max", () => {
    expect(
      clampLabelColumnWidth({
        width: LABEL_COLUMN_MAX_WIDTH,
        panelWidth: MIN_TIMELINE_TRACK_WIDTH + 40,
        canReorderTracks: false,
      }),
    ).toBe(LABEL_COLUMN_MIN_WIDTH);
  });
});
