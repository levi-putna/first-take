import { describe, expect, it } from "vitest";
import {
  audioFetchUrl,
  downsamplePeaks,
  mixPeakBars,
  peaksForTimelineClip,
  sampleFilePeak,
} from "./audioPeaks.js";

describe("audioFetchUrl", () => {
  it("prefixes relative asset paths", () => {
    expect(audioFetchUrl({ src: "assets/audio/bed.mp3" })).toBe(
      "/assets/audio/bed.mp3",
    );
    expect(audioFetchUrl({ src: "/assets/audio/bed.mp3" })).toBe(
      "/assets/audio/bed.mp3",
    );
  });
});

describe("downsamplePeaks", () => {
  it("normalises the loudest sample to 1", () => {
    const channel = new Float32Array([0, 0.2, -0.5, 0.1]);
    expect(downsamplePeaks({ channel, count: 2 })).toEqual([0.4, 1]);
  });
});

describe("peaksForTimelineClip", () => {
  it("pads silence before startFrom and after a non-looping file", () => {
    const file = { peaks: [1, 1], durationSeconds: 1 };
    expect(
      peaksForTimelineClip({
        file,
        barCount: 4,
        clipDurationSeconds: 4,
        loop: false,
        startFromSeconds: 1,
      }),
    ).toEqual([0, 1, 0, 0]);
  });

  it("tiles a looping bed across the clip", () => {
    const file = { peaks: [1], durationSeconds: 1 };
    expect(
      peaksForTimelineClip({
        file,
        barCount: 4,
        clipDurationSeconds: 4,
        loop: true,
      }),
    ).toEqual([1, 1, 1, 1]);
  });
});

describe("mixPeakBars", () => {
  it("takes the louder source per bar", () => {
    expect(
      mixPeakBars({
        groups: [
          [0.2, 0.9, 0],
          [0.5, 0.1, 0.4],
        ],
      }),
    ).toEqual([0.5, 0.9, 0.4]);
  });
});

describe("sampleFilePeak", () => {
  it("returns 0 outside the file", () => {
    expect(
      sampleFilePeak({
        peaks: [1],
        durationSeconds: 1,
        timeSeconds: 2,
      }),
    ).toBe(0);
  });
});
