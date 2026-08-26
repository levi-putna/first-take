import { describe, expect, it } from "vitest";
import {
  buildVolumeExpression,
  detectVolumeSegments,
  volumeFilterFromEnvelope,
} from "./volume-envelope.js";

describe("detectVolumeSegments", () => {
  it("detects a flat plateau", () => {
    expect(detectVolumeSegments([0.5, 0.5, 0.5])).toEqual([
      { type: "plateau", startFrame: 0, endFrame: 3, gain: 0.5 },
    ]);
  });

  it("detects a linear fade out then fade in", () => {
    const envelope = [1, 0.5, 0, 0.5, 1];
    const segments = detectVolumeSegments(envelope);
    expect(segments).toEqual([
      { type: "ramp", startFrame: 0, endFrame: 3, from: 1, to: 0 },
      { type: "ramp", startFrame: 3, endFrame: 5, from: 0.5, to: 1 },
    ]);
  });
});

describe("volumeFilterFromEnvelope", () => {
  it("emits a constant volume for a flat envelope", () => {
    expect(
      volumeFilterFromEnvelope({
        volumePerFrame: [0.7, 0.7, 0.7],
        fps: 30,
      }),
    ).toBe("volume=0.7");
  });

  it("emits volume=0 for silence", () => {
    expect(
      volumeFilterFromEnvelope({
        volumePerFrame: [0, 0, 0],
        fps: 30,
      }),
    ).toBe("volume=0");
  });

  it("emits an eval expression for a V-shaped fade", () => {
    // Hold, fade out, fade in, hold
    const volumePerFrame = [
      1, 1,
      0.5, 0,
      0.5, 1,
      1, 1,
    ];
    const filter = volumeFilterFromEnvelope({ volumePerFrame, fps: 2 });
    expect(filter.startsWith("volume='")).toBe(true);
    expect(filter.endsWith("':eval=frame")).toBe(true);
    expect(filter).toContain("if(lt(t");
  });

  it("builds nested if expressions from segments", () => {
    const segments = detectVolumeSegments([1, 0, 1]);
    const expr = buildVolumeExpression({ segments, fps: 1 });
    expect(expr).toContain("if(lt(t");
    expect(expr).toContain("1");
  });
});
