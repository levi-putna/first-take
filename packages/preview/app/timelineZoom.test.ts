import { describe, expect, it } from "vitest";
import {
  TIMELINE_MAX_PIXELS_PER_FRAME,
  TIMELINE_MIN_MAJOR_TICK_PX,
  TIMELINE_MIN_VISIBLE_SECONDS,
  TIMELINE_TAIL_GUTTER_MIN_PX,
  clampPixelsPerFrame,
  defaultPixelsPerFrame,
  durationFromTrimPointer,
  fitPixelsPerFrame,
  majorRulerStepFrames,
  scrollableDurationInFrames,
  tailGutterFrames,
  tailGutterPx,
  timelineContentWidth,
  trimEdgeScrollDeltaPx,
  viewportFromScroll,
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

describe("tail gutter", () => {
  const trackWidth = 800;

  it("keeps a similar pixel width at tight and wide zoom", () => {
    const gutter = tailGutterPx({ trackWidth });
    expect(gutter).toBeGreaterThanOrEqual(TIMELINE_TAIL_GUTTER_MIN_PX);
    expect(gutter).toBeLessThanOrEqual(trackWidth * 0.12);
  });

  it("covers fewer frames when zoomed in than when zoomed out", () => {
    const tightFrames = tailGutterFrames({
      trackWidth,
      pixelsPerFrame: 80,
    });
    const wideFrames = tailGutterFrames({
      trackWidth,
      pixelsPerFrame: 1,
    });
    expect(tightFrames).toBeLessThan(2);
    expect(wideFrames).toBeGreaterThan(tightFrames * 10);
  });

  it("leaves room after the last frame when fitting the piece", () => {
    const durationInFrames = 300;
    const ppf = fitPixelsPerFrame({ trackWidth, durationInFrames });
    const contentWidth = timelineContentWidth({
      durationInFrames,
      pixelsPerFrame: ppf,
      trackWidth,
    });
    expect(contentWidth).toBeCloseTo(trackWidth, 0);
    expect(durationInFrames * ppf).toBeLessThan(trackWidth);
  });

  it("lets the focus window extend past the last clip so the gutter is reachable", () => {
    const durationInFrames = 240;
    const pixelsPerFrame = 4;
    const scrollable = scrollableDurationInFrames({
      durationInFrames,
      trackWidth,
      pixelsPerFrame,
    });
    expect(scrollable).toBeGreaterThan(durationInFrames);

    const contentWidth = timelineContentWidth({
      durationInFrames,
      pixelsPerFrame,
      trackWidth,
    });
    const viewport = viewportFromScroll({
      scrollLeft: contentWidth - trackWidth,
      clientWidth: trackWidth,
      pixelsPerFrame,
      durationInFrames: scrollable,
    });
    expect(viewport.endFrame).toBeGreaterThan(durationInFrames);
    expect(durationInFrames * pixelsPerFrame).toBeLessThan(contentWidth);
  });

  it("defaults a short piece to fit-all including the gutter", () => {
    const durationInFrames = 120;
    const ppf = defaultPixelsPerFrame({
      trackWidth,
      durationInFrames,
      fps: 30,
    });
    expect(ppf).toBeCloseTo(
      fitPixelsPerFrame({ trackWidth, durationInFrames }),
      3,
    );
    expect(durationInFrames * ppf).toBeLessThan(trackWidth);
  });
});

describe("trim edge auto-scroll", () => {
  it("does not scroll while the pointer is in the middle of the scrollport", () => {
    expect(
      trimEdgeScrollDeltaPx({
        clientX: 400,
        viewportLeft: 0,
        viewportRight: 800,
      }),
    ).toBe(0);
  });

  it("scrolls right faster as the pointer approaches and passes the edge", () => {
    const near = trimEdgeScrollDeltaPx({
      clientX: 770,
      viewportLeft: 0,
      viewportRight: 800,
    });
    const atEdge = trimEdgeScrollDeltaPx({
      clientX: 800,
      viewportLeft: 0,
      viewportRight: 800,
    });
    const past = trimEdgeScrollDeltaPx({
      clientX: 860,
      viewportLeft: 0,
      viewportRight: 800,
    });
    expect(near).toBeGreaterThan(0);
    expect(atEdge).toBeGreaterThan(near);
    expect(past).toBeGreaterThan(atEdge);
  });

  it("maps trim duration from pointer and scroll, so auto-scroll can keep extending", () => {
    const startFrame = 0;
    const atRest = durationFromTrimPointer({
      clientX: 800,
      viewportLeft: 0,
      viewportWidth: 800,
      scrollLeft: 0,
      pixelsPerFrame: 4,
      startFrame,
    });
    const afterScroll = durationFromTrimPointer({
      clientX: 800,
      viewportLeft: 0,
      viewportWidth: 800,
      scrollLeft: 120,
      pixelsPerFrame: 4,
      startFrame,
    });
    expect(atRest).toBe(200);
    expect(afterScroll).toBe(230);
  });
});
