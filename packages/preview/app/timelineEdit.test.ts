import { describe, expect, it } from "vitest";
import { parseVideoManifest, scenePlacements } from "@levi-putna/storyboard-schema";
import {
  addTrack,
  canPlaceClip,
  moveScene,
  reorderTracks,
  scenesFromStartFrames,
  snapFrame,
  timelineStructureEqual,
  trackPlacements,
  trimSceneEnd,
  updateTrack,
} from "./timelineEdit.js";

const overlayManifest = parseVideoManifest({
  schemaVersion: 2,
  slug: "track-overlay",
  title: "Track Overlay",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 1280, height: 720 }],
  tracks: [
    {
      id: "background",
      title: "Background",
      scenes: [
        {
          id: "bg",
          title: "Background",
          visualType: "component",
          component: "bg.tsx",
          durationInFrames: 240,
          transitionIn: null,
        },
      ],
    },
    {
      id: "overlay",
      title: "Overlay",
      scenes: [
        {
          id: "title-a",
          title: "Lower third A",
          visualType: "component",
          component: "a.tsx",
          durationInFrames: 60,
          gapBeforeFrames: 20,
          transitionIn: { type: "fade", durationInFrames: 10 },
        },
        {
          id: "title-b",
          title: "Lower third B",
          visualType: "component",
          component: "b.tsx",
          durationInFrames: 80,
          gapBeforeFrames: 40,
          transitionIn: { type: "fade", durationInFrames: 10 },
        },
      ],
    },
  ],
});

const fadeManifest = parseVideoManifest({
  schemaVersion: 2,
  slug: "fade-overlap",
  title: "Fade Overlap",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 640, height: 360 }],
  tracks: [
    {
      id: "main",
      scenes: [
        {
          id: "01",
          title: "One",
          visualType: "component",
          component: "one.tsx",
          durationInFrames: 30,
          transitionIn: null,
        },
        {
          id: "02",
          title: "Two",
          visualType: "component",
          component: "two.tsx",
          durationInFrames: 30,
          transitionIn: { type: "fade", durationInFrames: 10 },
        },
      ],
    },
  ],
});

describe("timelineEdit", () => {
  it("round-trips gap math from absolute starts", () => {
    const scenes = scenesFromStartFrames({
      placements: [
        { scene: overlayManifest.tracks[1].scenes[0], from: 20 },
        { scene: overlayManifest.tracks[1].scenes[1], from: 120 },
      ],
    });
    expect(scenes[0].gapBeforeFrames).toBe(20);
    expect(scenes[1].gapBeforeFrames).toBe(40);
  });

  it("shrinks sequential fade overlap to match a preserved start frame", () => {
    const scenes = scenesFromStartFrames({
      placements: [
        {
          scene: { ...fadeManifest.tracks[0].scenes[0], durationInFrames: 25 },
          from: 0,
        },
        { scene: fadeManifest.tracks[0].scenes[1], from: 20 },
      ],
    });
    expect(scenes[1].transitionIn?.durationInFrames).toBe(5);
    expect(trackPlacements({ track: { ...fadeManifest.tracks[0], scenes } })[1].from).toBe(
      20,
    );
  });

  it("snaps within threshold", () => {
    expect(
      snapFrame({
        frame: 23,
        targets: [0, 20, 60],
        threshold: 5,
      }),
    ).toBe(20);
  });

  it("rejects forbidden overlap on a lane", () => {
    const track = overlayManifest.tracks[1];
    const clips = trackPlacements({ track });
    expect(
      canPlaceClip({
        clips,
        sceneId: "probe",
        from: 25,
        durationInFrames: 40,
        scene: {
          id: "probe",
          title: "Probe",
          component: "probe.tsx",
          durationInFrames: 40,
        },
      }),
    ).toBe(false);
  });

  it("moves a scene later on the same track without rippling neighbours", () => {
    const moved = moveScene({
      manifest: overlayManifest,
      sceneId: "title-a",
      targetTrackId: "overlay",
      startFrame: 85,
    });
    const placements = scenePlacements(moved).filter(
      (placement) => placement.trackId === "overlay",
    );
    const titleA = placements.find((placement) => placement.scene.id === "title-a");
    const titleB = placements.find((placement) => placement.scene.id === "title-b");
    expect(titleA?.from).toBe(60);
    expect(titleB?.from).toBe(120);
  });

  it("moves a scene onto another track", () => {
    const withLane = addTrack({
      manifest: overlayManifest,
      id: "badge",
      title: "Badge",
    });
    const moved = moveScene({
      manifest: withLane,
      sceneId: "title-a",
      targetTrackId: "badge",
      startFrame: 100,
    });
    const placements = scenePlacements(moved);
    expect(
      placements.find((placement) => placement.scene.id === "title-a")?.trackId,
    ).toBe("badge");
    expect(
      placements.find((placement) => placement.scene.id === "title-a")?.from,
    ).toBe(100);
  });

  it("trims a scene end without overlapping the next clip", () => {
    const trimmed = trimSceneEnd({
      manifest: overlayManifest,
      sceneId: "title-a",
      durationInFrames: 40,
    });
    const scene = trimmed.tracks[1].scenes.find((entry) => entry.id === "title-a");
    expect(scene?.durationInFrames).toBe(40);
  });

  it("preserves later clip start frames when trimming an earlier clip", () => {
    const before = scenePlacements(overlayManifest).filter(
      (placement) => placement.trackId === "overlay",
    );
    const trimmed = trimSceneEnd({
      manifest: overlayManifest,
      sceneId: "title-a",
      durationInFrames: 40,
    });
    const after = scenePlacements(trimmed).filter(
      (placement) => placement.trackId === "overlay",
    );
    expect(after.find((placement) => placement.scene.id === "title-a")?.from).toBe(
      before.find((placement) => placement.scene.id === "title-a")?.from,
    );
    expect(after.find((placement) => placement.scene.id === "title-b")?.from).toBe(
      before.find((placement) => placement.scene.id === "title-b")?.from,
    );
    expect(
      trimmed.tracks[1].scenes.find((entry) => entry.id === "title-b")
        ?.gapBeforeFrames,
    ).toBe(60);
  });

  it("preserves sequential fade overlap when trimming", () => {
    const trimmed = trimSceneEnd({
      manifest: fadeManifest,
      sceneId: "01",
      durationInFrames: 25,
    });
    expect(trimmed.tracks[0].scenes[0].durationInFrames).toBe(25);
    expect(scenePlacements(trimmed)[1].from).toBe(20);
  });

  it("adds and updates tracks", () => {
    const withTrack = addTrack({
      manifest: overlayManifest,
      title: "Badge",
      description: "Corner overlays",
    });
    expect(withTrack.tracks).toHaveLength(3);
    expect(withTrack.tracks[2].scenes).toEqual([]);

    const renamed = updateTrack({
      manifest: withTrack,
      trackId: withTrack.tracks[2].id,
      title: "Corner",
      description: "Top-right badge lane",
    });
    expect(renamed.tracks[2].title).toBe("Corner");
    expect(renamed.tracks[2].description).toBe("Top-right badge lane");
  });

  it("reorders tracks for render order", () => {
    const reordered = reorderTracks({
      manifest: overlayManifest,
      trackIds: ["overlay", "background"],
    });
    expect(reordered.tracks.map((track) => track.id)).toEqual([
      "overlay",
      "background",
    ]);
  });

  it("detects structural timeline changes", () => {
    const moved = moveScene({
      manifest: overlayManifest,
      sceneId: "title-a",
      targetTrackId: "overlay",
      startFrame: 85,
    });
    expect(
      timelineStructureEqual({ left: overlayManifest, right: moved }),
    ).toBe(false);
    expect(
      timelineStructureEqual({ left: overlayManifest, right: overlayManifest }),
    ).toBe(true);
  });
});
