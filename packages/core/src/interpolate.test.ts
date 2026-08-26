import { describe, expect, it } from "vitest";
import { interpolate } from "./interpolate.js";
import { spring } from "./spring.js";
import { Easing } from "./easing.js";

describe("interpolate", () => {
  it("maps midpoints linearly", () => {
    expect(interpolate(10, [0, 20], [0, 1])).toBeCloseTo(0.5);
  });

  it("clamps on the right", () => {
    expect(
      interpolate(40, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
    ).toBe(1);
  });

  it("applies easing", () => {
    const v = interpolate(10, [0, 20], [0, 1], { easing: Easing.quad });
    expect(v).toBeCloseTo(0.25);
  });
});

describe("spring", () => {
  it("starts near from and settles toward to", () => {
    const start = spring({ frame: 0, fps: 30, from: 0, to: 1 });
    const mid = spring({ frame: 15, fps: 30, from: 0, to: 1 });
    const end = spring({ frame: 120, fps: 30, from: 0, to: 1 });
    expect(start).toBeCloseTo(0, 1);
    expect(mid).toBeGreaterThan(start);
    expect(end).toBeGreaterThan(0.9);
  });
});
