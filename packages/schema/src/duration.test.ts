import { describe, expect, it } from "vitest";
import {
  contentDurationInFrames,
  leadInFrames,
  parseVideoManifest,
  totalDurationInFrames,
  validateTransitionLengths,
} from "./index.js";

const base = {
  schemaVersion: 1 as const,
  slug: "test",
  title: "Test",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 1920, height: 1080 }],
  scenes: [
    {
      id: "01",
      title: "Hook",
      visualType: "component" as const,
      component: "scenes/01.tsx",
      durationInFrames: 90,
      transitionIn: null,
    },
    {
      id: "02",
      title: "Fix",
      visualType: "component" as const,
      component: "scenes/02.tsx",
      durationInFrames: 120,
      transitionIn: { type: "fade" as const, durationInFrames: 15 },
    },
  ],
};

describe("duration helpers", () => {
  it("computes content duration with fade overlap (90+120-15=195)", () => {
    const manifest = parseVideoManifest(base);
    expect(contentDurationInFrames(manifest)).toBe(195);
  });

  it("includes lead-in and tail in total duration", () => {
    const manifest = parseVideoManifest({
      ...base,
      seriesAudio: {
        leadInSeconds: 4,
        tailSeconds: 1,
        jingleVolume: 0.55,
        bedVolumeUnderVo: 0.12,
        bedVolumeLeadIn: 0.08,
        jingleFadeOutSeconds: 0.6,
        bedFadeInSeconds: 0.8,
        bedFadeOutSeconds: 1.2,
      },
    });
    expect(leadInFrames(manifest)).toBe(120);
    // 120 + 195 + 30 = 345
    expect(totalDurationInFrames(manifest)).toBe(345);
  });

  it("rejects transitions longer than adjacent scenes", () => {
    const manifest = parseVideoManifest({
      ...base,
      scenes: [
        { ...base.scenes[0], durationInFrames: 10 },
        {
          ...base.scenes[1],
          transitionIn: { type: "fade", durationInFrames: 15 },
        },
      ],
    });
    const errors = validateTransitionLengths(manifest);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("hard cuts sum without overlap", () => {
    const manifest = parseVideoManifest({
      ...base,
      scenes: [
        { ...base.scenes[0], transitionIn: null },
        { ...base.scenes[1], transitionIn: null },
      ],
    });
    expect(contentDurationInFrames(manifest)).toBe(210);
  });
});
