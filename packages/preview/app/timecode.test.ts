import { describe, expect, it } from "vitest";
import {
  decimalsForTickFrames,
  formatFlooredTimecode,
  rulerDecimalPlaces,
} from "./timecode.js";

describe("rulerDecimalPlaces", () => {
  it("uses whole seconds for 1s ticks", () => {
    expect(rulerDecimalPlaces({ stepFrames: 30, fps: 30 })).toBe(0);
  });

  it("uses one decimal for 0.5s ticks", () => {
    expect(rulerDecimalPlaces({ stepFrames: 15, fps: 30 })).toBe(1);
  });

  it("uses two decimals for 5-frame 30fps ticks so 0.17 stays even", () => {
    expect(rulerDecimalPlaces({ stepFrames: 5, fps: 30 })).toBe(2);
  });

  it("uses two decimals for 0.05s ticks", () => {
    expect(rulerDecimalPlaces({ stepFrames: 2, fps: 40 })).toBe(2);
  });

  it("uses three decimals for 0.025s ticks", () => {
    expect(rulerDecimalPlaces({ stepFrames: 1, fps: 40 })).toBe(3);
  });

  it("uses three decimals for 1/30s ticks rather than collapsing to 0.0", () => {
    expect(rulerDecimalPlaces({ stepFrames: 1, fps: 30 })).toBe(3);
  });
});

describe("decimalsForTickFrames", () => {
  it("does not label six 5-frame ticks as the same 0:00", () => {
    const frames = [0, 5, 10, 15, 20, 25, 30];
    const decimals = decimalsForTickFrames({ frames, fps: 30 });
    const labels = frames.map((frame) =>
      formatFlooredTimecode({ frame, fps: 30, decimals }),
    );
    expect(decimals).toBe(2);
    expect(labels).toEqual([
      "0.00",
      "0.17",
      "0.33",
      "0.50",
      "0.67",
      "0.83",
      "1.00",
    ]);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("formatFlooredTimecode", () => {
  it("keeps whole-second m:ss labels when step is 1s", () => {
    expect(
      formatFlooredTimecode({ frame: 0, fps: 30, stepFrames: 30 }),
    ).toBe("0:00");
    expect(
      formatFlooredTimecode({ frame: 150, fps: 30, stepFrames: 30 }),
    ).toBe("0:05");
  });

  it("shows 0.5 at half-second ticks", () => {
    expect(
      formatFlooredTimecode({ frame: 15, fps: 30, stepFrames: 15 }),
    ).toBe("0.5");
  });

  it("shows 0.17 at 5-frame 30fps ticks", () => {
    expect(
      formatFlooredTimecode({ frame: 5, fps: 30, stepFrames: 5 }),
    ).toBe("0.17");
  });

  it("shows 0.025 at one-frame 40fps ticks", () => {
    expect(
      formatFlooredTimecode({ frame: 1, fps: 40, stepFrames: 1 }),
    ).toBe("0.025");
    expect(
      formatFlooredTimecode({ frame: 2, fps: 40, stepFrames: 1 }),
    ).toBe("0.050");
  });

  it("keeps consecutive 40fps frame ticks unique", () => {
    const labels = [0, 1, 2, 3, 4].map((frame) =>
      formatFlooredTimecode({ frame, fps: 40, stepFrames: 1 }),
    );
    expect(labels).toEqual(["0.000", "0.025", "0.050", "0.075", "0.100"]);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("uses three decimals when two would share a 0.02 label", () => {
    const labels = [1, 2, 3].map((frame) =>
      formatFlooredTimecode({ frame, fps: 120, stepFrames: 1 }),
    );
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((label) => label !== "0.02")).toBe(true);
  });

  it("uses m:ss.sss past one minute", () => {
    expect(
      formatFlooredTimecode({ frame: 40 * 61 + 1, fps: 40, stepFrames: 1 }),
    ).toBe("1:01.025");
  });

  it("keeps hours when the piece is long", () => {
    expect(
      formatFlooredTimecode({ frame: 30 * 3600, fps: 30, stepFrames: 30 }),
    ).toBe("1:00:00");
  });
});
