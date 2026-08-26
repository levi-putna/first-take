import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StoryboardProvider, useCurrentFrame } from "./context.js";
import { Sequence } from "./Sequence.js";

function FrameProbe({ onFrame }: { onFrame: (n: number) => void }) {
  const frame = useCurrentFrame();
  onFrame(frame);
  return <div data-testid="frame">{frame}</div>;
}

describe("Sequence", () => {
  it("resets local frame relative to from", () => {
    let seen = -1;
    render(
      <StoryboardProvider
        frame={25}
        config={{
          id: "t",
          fps: 30,
          width: 100,
          height: 100,
          durationInFrames: 100,
        }}
      >
        <Sequence from={10} durationInFrames={50}>
          <FrameProbe onFrame={(n) => {
            seen = n;
          }} />
        </Sequence>
      </StoryboardProvider>,
    );
    expect(seen).toBe(15);
  });

  it("nests relative time", () => {
    let seen = -1;
    render(
      <StoryboardProvider
        frame={30}
        config={{
          id: "t",
          fps: 30,
          width: 100,
          height: 100,
          durationInFrames: 100,
        }}
      >
        <Sequence from={10}>
          <Sequence from={5}>
            <FrameProbe onFrame={(n) => {
              seen = n;
            }} />
          </Sequence>
        </Sequence>
      </StoryboardProvider>,
    );
    // parent local 20, nested from 5 → 15
    expect(seen).toBe(15);
  });
});
