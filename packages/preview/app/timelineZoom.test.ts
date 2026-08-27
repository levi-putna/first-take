import { describe, expect, it } from "vitest";
import {
  TIMELINE_MAX_PIXELS_PER_FRAME,
  TIMELINE_MIN_MAJOR_TICK_PX,
  TIMELINE_MIN_VISIBLE_SECONDS,
  clampPixelsPerFrame,
  majorRulerStepFrames,
} from "./timelineZoom.js";

describe("majorRulerStepFrames", () => {
  it("can step by one 40fps frame when zoomed in far enough for 0.025s labels", () => {
    const pixelsPerFrame = TIMELINE_MIN_MAJOR_TICK_PX;
    const step = majorRulerStepFrames({ pixelsPerFrame, fps: 40 });
    expect(step).toBe(1);
    expect(step / 40).toBe(0.025);
  });

  it("steps up when labels would overlap", () => {
    const step = majorRulerStepFrames({ pixelsPerFrame: 2, fps: 30 });
    expect(step * 2).toBeGreaterThanOrEqual(TIMELINE_MIN_MAJOR_TICK_PX);
  });
});

describe("clampPixelsPerFrame", () => {
  it("allows a window short enough for 0.025s ticks on a typical studio width", () => {
    const ppf = clampPixelsPerFrame({
      pixelsPerFrame: TIMELINE_MAX_PIXELS_PER_FRAME,
      trackWidth: 800,
      durationInFrames: 40 * 60,
      fps: 40,
    });
    const visibleFrames = 800 / ppf;
    const visibleSeconds = visibleFrames / 40;
    expect(visibleSeconds).toBeLessThanOrEqual(TIMELINE_MIN_VISIBLE_SECONDS + 0.1);

    const step = majorRulerStepFrames({ pixelsPerFrame: ppf, fps: 40 });
    expect(step).toBe(1);
  });
});
