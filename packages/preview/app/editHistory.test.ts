import { describe, expect, it } from "vitest";
import { parseVideoManifest } from "@levi-putna/storyboard-schema";
import {
  COALESCE_MS,
  commitHistory,
  propOverridesEqual,
  redoHistory,
  resetHistory,
  studioSnapshotEqual,
  undoHistory,
  type StudioSnapshot,
} from "./editHistory.js";

const baseManifest = parseVideoManifest({
  schemaVersion: 3,
  slug: "test",
  title: "Test",
  fps: 30,
  formats: [{ id: "16x9", aspectRatio: "16:9", width: 1280, height: 720 }],
  tracks: [
    {
      id: "main",
      title: "Main",
      scenes: [
        {
          id: "scene-a",
          title: "Scene A",
          visualType: "component",
          component: "a.tsx",
          durationInFrames: 30,
        },
      ],
    },
  ],
});

function snapshot(
  overrides: Partial<StudioSnapshot> & {
    title?: string;
    propOverrides?: Record<string, Record<string, unknown>>;
  } = {},
): StudioSnapshot {
  return {
    workingManifest: {
      ...baseManifest,
      title: overrides.title ?? baseManifest.title,
    },
    propOverrides: overrides.propOverrides ?? {},
  };
}

describe("studioSnapshotEqual", () => {
  it("treats identical snapshots as equal", () => {
    const left = snapshot();
    const right = snapshot();
    expect(studioSnapshotEqual({ left, right })).toBe(true);
  });

  it("detects manifest title changes", () => {
    const left = snapshot();
    const right = snapshot({ title: "Renamed" });
    expect(studioSnapshotEqual({ left, right })).toBe(false);
  });

  it("detects prop override changes", () => {
    const left = snapshot();
    const right = snapshot({ propOverrides: { "scene-a": { colour: "#fff" } } });
    expect(studioSnapshotEqual({ left, right })).toBe(false);
  });
});

describe("propOverridesEqual", () => {
  it("compares nested prop maps", () => {
    const left = { a: { x: 1, y: "two" } };
    const right = { a: { x: 1, y: "two" } };
    expect(propOverridesEqual(left, right)).toBe(true);
    expect(propOverridesEqual(left, { a: { x: 2, y: "two" } })).toBe(false);
  });
});

describe("commitHistory", () => {
  it("pushes the previous present onto past", () => {
    const initial = resetHistory({ snapshot: snapshot() });
    const renamed = snapshot({ title: "Renamed" });
    const next = commitHistory({ state: initial, next: renamed });
    expect(next.past).toHaveLength(1);
    expect(next.present.workingManifest.title).toBe("Renamed");
    expect(next.future).toHaveLength(0);
  });

  it("skips no-op commits", () => {
    const initial = resetHistory({ snapshot: snapshot() });
    const same = commitHistory({ state: initial, next: snapshot() });
    expect(same).toBe(initial);
  });

  it("caps the past stack", () => {
    let state = resetHistory({ snapshot: snapshot({ title: "0" }) });
    for (let index = 1; index <= 55; index++) {
      state = commitHistory({
        state,
        next: snapshot({ title: String(index) }),
      });
    }
    expect(state.past.length).toBeLessThanOrEqual(50);
  });

  it("coalesces prop-only commits inside the window", () => {
    const initial = resetHistory({ snapshot: snapshot() });
    const first = commitHistory({
      state: initial,
      next: snapshot({ propOverrides: { "scene-a": { colour: "#111" } } }),
      coalesce: true,
      now: 1000,
    });
    expect(first.past).toHaveLength(1);

    const second = commitHistory({
      state: first,
      next: snapshot({ propOverrides: { "scene-a": { colour: "#222" } } }),
      coalesce: true,
      now: 1000 + COALESCE_MS - 1,
    });
    expect(second.past).toHaveLength(1);
    expect(second.present.propOverrides["scene-a"]?.colour).toBe("#222");
  });
});

describe("undoHistory and redoHistory", () => {
  it("restores a prior snapshot and preserves redo", () => {
    let state = resetHistory({ snapshot: snapshot() });
    state = commitHistory({ state, next: snapshot({ title: "Edited" }) });
    const undone = undoHistory({ state });
    expect(undone?.present.workingManifest.title).toBe("Test");
    expect(undone?.future).toHaveLength(1);

    const redone = redoHistory({ state: undone! });
    expect(redone?.present.workingManifest.title).toBe("Edited");
  });

  it("returns null when nothing to undo or redo", () => {
    const state = resetHistory({ snapshot: snapshot() });
    expect(undoHistory({ state })).toBeNull();
    expect(redoHistory({ state })).toBeNull();
  });
});

describe("resetHistory", () => {
  it("clears past and future", () => {
    let state = resetHistory({ snapshot: snapshot() });
    state = commitHistory({ state, next: snapshot({ title: "Edited" }) });
    const reset = resetHistory({ snapshot: snapshot({ title: "Fresh" }) });
    expect(reset.past).toHaveLength(0);
    expect(reset.future).toHaveLength(0);
    expect(reset.present.workingManifest.title).toBe("Fresh");
  });
});
