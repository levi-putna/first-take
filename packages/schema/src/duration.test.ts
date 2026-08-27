import { describe, expect, it } from "vitest";
import {
  contentDurationInFrames,
  parseVideoManifest,
  scenePlacements,
  totalDurationInFrames,
  trackDurationInFrames,
  validateUniqueSceneIds,
} from "./index.js";

const base = {
  schemaVersion: 3 as const,
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
        },
        {
          id: "02",
          title: "Fix",
          visualType: "component" as const,
          component: "scenes/02.tsx",
          durationInFrames: 120,
        },
      ],
    },
  ],
};

describe("duration helpers", () => {
  it("computes track duration as sum of gaps and scenes (90+120=210)", () => {
    const manifest = parseVideoManifest(base);
    expect(trackDurationInFrames({ track: manifest.tracks[0] })).toBe(210);
    expect(contentDurationInFrames(manifest)).toBe(210);
    expect(totalDurationInFrames(manifest)).toBe(210);
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

  it("includes gapBeforeFrames in track length", () => {
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
    expect(totalDurationInFrames(manifest)).toBe(105);
    const placements = scenePlacements(manifest);
    expect(placements[0].from).toBe(20);
    expect(placements[1].from).toBe(65);
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
