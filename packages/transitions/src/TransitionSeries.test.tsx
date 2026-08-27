import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AbsoluteFill, StoryboardProvider } from "@levi-putna/storyboard-core";
import { computeScenePlacements, TransitionSeries } from "./TransitionSeries.js";
import type { Scene } from "@levi-putna/storyboard-schema";

afterEach(() => {
  cleanup();
});

const scenes: Scene[] = [
  {
    id: "01",
    title: "A",
    visualType: "component",
    component: "A",
    durationInFrames: 30,
    gapBeforeFrames: 0,
  },
  {
    id: "02",
    title: "B",
    visualType: "component",
    component: "B",
    durationInFrames: 30,
    gapBeforeFrames: 0,
  },
];

describe("computeScenePlacements", () => {
  it("abuts sequential scenes without overlap", () => {
    const placements = computeScenePlacements(scenes);
    expect(placements[0].from).toBe(0);
    expect(placements[1].from).toBe(30);
  });

  it("places a scene after a gap", () => {
    const gapped: Scene[] = [
      {
        id: "a",
        title: "A",
        visualType: "component",
        component: "A",
        durationInFrames: 20,
        gapBeforeFrames: 10,
      },
      {
        id: "b",
        title: "B",
        visualType: "component",
        component: "B",
        durationInFrames: 20,
        gapBeforeFrames: 15,
      },
    ];
    const placements = computeScenePlacements(gapped);
    expect(placements[0].from).toBe(10);
    expect(placements[1].from).toBe(45);
  });
});

describe("TransitionSeries", () => {
  it("mounts the active scene at a mid-timeline frame", () => {
    const Red = () => (
      <AbsoluteFill style={{ backgroundColor: "#f00" }}>
        <span data-testid="red">red</span>
      </AbsoluteFill>
    );
    const Blue = () => (
      <AbsoluteFill style={{ backgroundColor: "#00f" }}>
        <span data-testid="blue">blue</span>
      </AbsoluteFill>
    );

    const { getByTestId, queryByTestId } = render(
      <StoryboardProvider
        frame={5}
        config={{
          id: "t",
          fps: 30,
          width: 100,
          height: 100,
          durationInFrames: 60,
        }}
      >
        <TransitionSeries
          scenes={scenes}
          components={{ A: Red, B: Blue }}
        />
      </StoryboardProvider>,
    );

    expect(getByTestId("red")).toBeTruthy();
    expect(queryByTestId("blue")).toBeNull();
  });

  it("switches to the second scene after the first ends", () => {
    const Red = () => <span data-testid="red">red</span>;
    const Blue = () => <span data-testid="blue">blue</span>;

    const { getByTestId, queryByTestId } = render(
      <StoryboardProvider
        frame={35}
        config={{
          id: "t",
          fps: 30,
          width: 100,
          height: 100,
          durationInFrames: 60,
        }}
      >
        <TransitionSeries
          scenes={scenes}
          components={{ A: Red, B: Blue }}
        />
      </StoryboardProvider>,
    );

    expect(queryByTestId("red")).toBeNull();
    expect(getByTestId("blue")).toBeTruthy();
  });
});
