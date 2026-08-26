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
    transitionIn: null,
  },
  {
    id: "02",
    title: "B",
    visualType: "component",
    component: "B",
    durationInFrames: 30,
    transitionIn: { type: "fade", durationInFrames: 10 },
  },
];

describe("computeScenePlacements", () => {
  it("overlaps the second scene by the fade length", () => {
    const placements = computeScenePlacements(scenes);
    expect(placements[0].from).toBe(0);
    expect(placements[1].from).toBe(20);
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
          durationInFrames: 50,
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

  it("shows both scenes during a fade overlap", () => {
    const Red = () => <span data-testid="red">red</span>;
    const Blue = () => <span data-testid="blue">blue</span>;

    const { getByTestId } = render(
      <StoryboardProvider
        frame={25}
        config={{
          id: "t",
          fps: 30,
          width: 100,
          height: 100,
          durationInFrames: 50,
        }}
      >
        <TransitionSeries
          scenes={scenes}
          components={{ A: Red, B: Blue }}
        />
      </StoryboardProvider>,
    );

    expect(getByTestId("red")).toBeTruthy();
    expect(getByTestId("blue")).toBeTruthy();
  });
});
