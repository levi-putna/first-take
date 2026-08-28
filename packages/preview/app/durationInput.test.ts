import { describe, expect, it } from "vitest";
import {
  clampDurationInFrames,
  formatDurationSeconds,
  parseDurationInput,
  secondsToFrames,
} from "./durationInput.js";

describe("secondsToFrames", () => {
  it("never returns less than one frame", () => {
    expect(secondsToFrames({ seconds: 0, fps: 30 })).toBe(1);
    expect(secondsToFrames({ seconds: -2, fps: 30 })).toBe(1);
  });

  it("snaps seconds to the nearest frame", () => {
    expect(secondsToFrames({ seconds: 1, fps: 30 })).toBe(30);
    expect(secondsToFrames({ seconds: 3.5, fps: 30 })).toBe(105);
    expect(secondsToFrames({ seconds: 1 / 30, fps: 30 })).toBe(1);
  });
});

describe("formatDurationSeconds", () => {
  it.each([24, 30, 60])(
    "round-trips every frame from 1 to 2×%s fps",
    (fps) => {
      const last = fps * 2;
      for (let frames = 1; frames <= last; frames++) {
        const text = formatDurationSeconds({ frames, fps });
        const parsed = parseDurationInput({ text, fps });
        expect(parsed).toEqual({ ok: true, frames });
      }
    },
  );

  it("uses a whole number for exact seconds", () => {
    expect(formatDurationSeconds({ frames: 120, fps: 30 })).toBe("4");
  });

  it("keeps a short decimal when it is exact", () => {
    expect(formatDurationSeconds({ frames: 105, fps: 30 })).toBe("3.5");
  });
});

describe("parseDurationInput", () => {
  it("parses seconds with and without a unit", () => {
    expect(parseDurationInput({ text: "4", fps: 30 })).toEqual({
      ok: true,
      frames: 120,
    });
    expect(parseDurationInput({ text: "3.5", fps: 30 })).toEqual({
      ok: true,
      frames: 105,
    });
    expect(parseDurationInput({ text: "4s", fps: 30 })).toEqual({
      ok: true,
      frames: 120,
    });
    expect(parseDurationInput({ text: "4 s", fps: 30 })).toEqual({
      ok: true,
      frames: 120,
    });
  });

  it("parses m:ss and m:ss.frac", () => {
    expect(parseDurationInput({ text: "0:04", fps: 30 })).toEqual({
      ok: true,
      frames: 120,
    });
    expect(parseDurationInput({ text: "1:05.5", fps: 30 })).toEqual({
      ok: true,
      frames: 1965,
    });
  });

  it("rejects empty, garbage, frame counts, and timecode-with-frames", () => {
    expect(parseDurationInput({ text: "", fps: 30 })).toEqual({ ok: false });
    expect(parseDurationInput({ text: "  ", fps: 30 })).toEqual({ ok: false });
    expect(parseDurationInput({ text: "abc", fps: 30 })).toEqual({ ok: false });
    expect(parseDurationInput({ text: "120f", fps: 30 })).toEqual({ ok: false });
    expect(parseDurationInput({ text: "00:04:15", fps: 30 })).toEqual({
      ok: false,
    });
  });

  it("rejects m:ss values with 60 or more seconds", () => {
    expect(parseDurationInput({ text: "0:60", fps: 30 })).toEqual({ ok: false });
  });
});

describe("clampDurationInFrames", () => {
  it("clamps to at least one frame", () => {
    expect(clampDurationInFrames({ durationInFrames: 0 })).toBe(1);
  });

  it("clamps to the next-clip maximum when provided", () => {
    expect(
      clampDurationInFrames({
        durationInFrames: 90,
        maxDurationInFrames: 45,
      }),
    ).toBe(45);
  });
});
