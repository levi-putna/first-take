import { execa } from "execa";

export type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
  nb_frames?: string;
};

export type FfprobeResult = {
  format: {
    duration?: string;
    size?: string;
  };
  streams: FfprobeStream[];
};

/**
 * Probe a media file with ffprobe (JSON output).
 */
export async function ffprobeJson({
  filePath,
}: {
  filePath: string;
}): Promise<FfprobeResult> {
  const { stdout } = await execa("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size:stream=codec_type,codec_name,width,height,duration,nb_frames",
    "-of",
    "json",
    filePath,
  ]);
  return JSON.parse(stdout) as FfprobeResult;
}

/**
 * Pick the first video stream from an ffprobe result.
 */
export function videoStream({
  probe,
}: {
  probe: FfprobeResult;
}): FfprobeStream | undefined {
  return probe.streams.find((s) => s.codec_type === "video");
}

/**
 * Pick the first audio stream from an ffprobe result.
 */
export function audioStream({
  probe,
}: {
  probe: FfprobeResult;
}): FfprobeStream | undefined {
  return probe.streams.find((s) => s.codec_type === "audio");
}

/**
 * Assert duration is within one frame of expected.
 */
export function assertDurationClose({
  actualSeconds,
  expectedFrames,
  fps,
}: {
  actualSeconds: number;
  expectedFrames: number;
  fps: number;
}): void {
  const expected = expectedFrames / fps;
  const tolerance = 1 / fps + 0.05;
  const delta = Math.abs(actualSeconds - expected);
  if (delta > tolerance) {
    throw new Error(
      `Duration ${actualSeconds}s differs from expected ${expected}s (${expectedFrames}f @ ${fps}fps) by ${delta}s`,
    );
  }
}
