import { describe, expect, it } from "vitest";
import {
  contentDurationInFrames,
  parseVideoManifest,
  scenePlacements,
  totalDurationInFrames,
  trackDurationInFrames,
  validateTransitionLengths,
  validateUniqueSceneIds,
} from "./index.js";

const base = {
  schemaVersion: 2 as const,
  slug: "test",
  title: "Test",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 1920, height: 1080 }],
  tracks: [
    {
      id: "main",
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
    },
  ],
};

describe("duration helpers", () => {
  it("computes track duration with fade overlap (90+120-15=195)", () => {
    const manifest = parseVideoManifest(base);
    expect(trackDurationInFrames({ track: manifest.tracks[0] })).toBe(195);
    expect(contentDurationInFrames(manifest)).toBe(195);
    expect(totalDurationInFrames(manifest)).toBe(195);
  });

  it("uses the longest track as composition duration", () => {
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        {
          id: "visual",
          scenes: [
            {
              id: "a",
              title: "A",
              visualType: "component" as const,
              component: "a.tsx",
              durationInFrames: 60,
            },
          ],
        },
        {
          id: "bed",
          scenes: [
            {
              id: "bed",
              title: "Bed",
              visualType: "component" as const,
              component: "bed.tsx",
              durationInFrames: 180,
            },
          ],
        },
      ],
    });
    expect(totalDurationInFrames(manifest)).toBe(180);
  });

  it("includes gapBeforeFrames without shortening for a fade after a gap", () => {
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        {
          id: "overlay",
          scenes: [
            {
              id: "a",
              title: "A",
              visualType: "component" as const,
              component: "a.tsx",
              durationInFrames: 30,
              gapBeforeFrames: 20,
              transitionIn: { type: "fade", durationInFrames: 10 },
            },
            {
              id: "b",
              title: "B",
              visualType: "component" as const,
              component: "b.tsx",
              durationInFrames: 40,
              gapBeforeFrames: 15,
            },
          ],
        },
      ],
    });
    // 20 + 30 + 15 + 40 = 105 (fade after gap does not overlap)
    expect(totalDurationInFrames(manifest)).toBe(105);
    const placements = scenePlacements(manifest);
    expect(placements[0].from).toBe(20);
    expect(placements[1].from).toBe(65);
  });

  it("rejects sequential transitions longer than adjacent scenes", () => {
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        {
          id: "main",
          scenes: [
            { ...base.tracks[0].scenes[0], durationInFrames: 10 },
            {
              ...base.tracks[0].scenes[1],
              transitionIn: { type: "fade", durationInFrames: 15 },
            },
          ],
        },
      ],
    });
    const errors = validateTransitionLengths(manifest);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("hard cuts sum without overlap", () => {
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        {
          id: "main",
          scenes: [
            { ...base.tracks[0].scenes[0], transitionIn: null },
            { ...base.tracks[0].scenes[1], transitionIn: null },
          ],
        },
      ],
    });
    expect(totalDurationInFrames(manifest)).toBe(210);
  });

  it("rejects duplicate scene ids across tracks", () => {
    const manifest = parseVideoManifest({
      ...base,
      tracks: [
        {
          id: "a",
          scenes: [base.tracks[0].scenes[0]],
        },
        {
          id: "b",
          scenes: [{ ...base.tracks[0].scenes[0], title: "Copy" }],
        },
      ],
    });
    expect(validateUniqueSceneIds(manifest).length).toBeGreaterThan(0);
  });
});
