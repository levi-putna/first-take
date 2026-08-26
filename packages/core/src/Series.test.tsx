import { describe, expect, it, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { StoryboardProvider, useCurrentFrame } from "./context.js";
import { Series } from "./Series.js";
import { AbsoluteFill } from "./AbsoluteFill.js";
import {
  cancelRender,
  continueRender,
  delayRender,
  getPendingDelayLabels,
  isRenderReady,
  resetDelayRenderState,
  waitForRenderReady,
} from "./delay-render.js";
import { Easing } from "./easing.js";
import { spring } from "./spring.js";

function FrameProbe({ onFrame }: { onFrame: (n: number) => void }) {
  const frame = useCurrentFrame();
  onFrame(frame);
  return <span data-testid="f">{frame}</span>;
}

const config = {
  id: "t",
  fps: 30,
  width: 100,
  height: 100,
  durationInFrames: 200,
};

describe("Series", () => {
  it("stitches sequences back-to-back", () => {
    const seen: number[] = [];
    render(
      <StoryboardProvider frame={25} config={config}>
        <Series>
          <Series.Sequence durationInFrames={20}>
            <FrameProbe onFrame={(n) => seen.push(n)} />
          </Series.Sequence>
          <Series.Sequence durationInFrames={30}>
            <FrameProbe onFrame={(n) => seen.push(n)} />
          </Series.Sequence>
        </Series>
      </StoryboardProvider>,
    );
    // Global 25 → second sequence local 5
    expect(seen).toEqual([5]);
  });

  it("rejects non-Series.Sequence children", () => {
    expect(() =>
      render(
        <StoryboardProvider frame={0} config={config}>
          <Series>
            <div>nope</div>
          </Series>
        </StoryboardProvider>,
      ),
    ).toThrow(/Series.Sequence/);
  });
});

describe("AbsoluteFill", () => {
  it("renders a full-bleed absolute container", () => {
    const { container } = render(
      <AbsoluteFill style={{ backgroundColor: "red" }}>
        <span>hi</span>
      </AbsoluteFill>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.position).toBe("absolute");
    expect(["0", "0px"]).toContain(el.style.inset);
    expect(el.textContent).toBe("hi");
  });
});

describe("delayRender", () => {
  beforeEach(() => {
    resetDelayRenderState();
  });

  it("tracks pending handles until continueRender", async () => {
    expect(isRenderReady()).toBe(true);
    const handle = delayRender("fonts");
    expect(isRenderReady()).toBe(false);
    expect(getPendingDelayLabels()).toEqual(["fonts"]);
    const wait = waitForRenderReady({ timeoutMs: 1000 });
    continueRender(handle);
    await expect(wait).resolves.toBeUndefined();
    expect(isRenderReady()).toBe(true);
  });

  it("rejects waiters on cancelRender", async () => {
    delayRender("img");
    const wait = waitForRenderReady({ timeoutMs: 1000 });
    cancelRender(new Error("boom"));
    await expect(wait).rejects.toThrow("boom");
  });
});

describe("Easing", () => {
  it("supports linear, quad, and out wrappers", () => {
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.quad(0.5)).toBe(0.25);
    expect(Easing.out(Easing.quad)(0)).toBe(0);
    expect(Easing.out(Easing.quad)(1)).toBe(1);
    expect(Easing.inOut(Easing.quad)(0.25)).toBeCloseTo(0.125);
  });

  it("bezier returns endpoints", () => {
    const ease = Easing.bezier(0.42, 0, 0.58, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0);
    expect(ease(0.5)).toBeLessThan(1);
  });
});

describe("spring durationInFrames", () => {
  it("returns to when frame exceeds durationInFrames", () => {
    const v = spring({
      frame: 40,
      fps: 30,
      from: 0,
      to: 1,
      durationInFrames: 20,
    });
    expect(v).toBe(1);
  });
});
