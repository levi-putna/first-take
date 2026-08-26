const EPS = 1e-4;

export type VolumePlateau = {
  type: "plateau";
  startFrame: number;
  endFrame: number;
  gain: number;
};

export type VolumeRamp = {
  type: "ramp";
  startFrame: number;
  endFrame: number;
  from: number;
  to: number;
};

export type VolumeSegment = VolumePlateau | VolumeRamp;

/**
 * Split a per-frame volume envelope into plateaus and linear ramps.
 */
export function detectVolumeSegments(volumePerFrame: number[]): VolumeSegment[] {
  if (volumePerFrame.length === 0) return [];

  const segments: VolumeSegment[] = [];
  let i = 0;

  while (i < volumePerFrame.length) {
    if (i === volumePerFrame.length - 1) {
      segments.push({
        type: "plateau",
        startFrame: i,
        endFrame: i + 1,
        gain: volumePerFrame[i]!,
      });
      break;
    }

    const step = volumePerFrame[i + 1]! - volumePerFrame[i]!;

    if (Math.abs(step) < EPS) {
      // Constant plateau
      let j = i + 1;
      while (
        j < volumePerFrame.length &&
        Math.abs(volumePerFrame[j]! - volumePerFrame[i]!) < EPS
      ) {
        j += 1;
      }
      segments.push({
        type: "plateau",
        startFrame: i,
        endFrame: j,
        gain: volumePerFrame[i]!,
      });
      i = j;
      continue;
    }

    // Linear ramp with a steady per-frame step
    let j = i + 1;
    while (
      j + 1 < volumePerFrame.length &&
      Math.abs(volumePerFrame[j + 1]! - volumePerFrame[j]! - step) < EPS
    ) {
      j += 1;
    }
    const endFrame = j + 1;
    segments.push({
      type: "ramp",
      startFrame: i,
      endFrame,
      from: volumePerFrame[i]!,
      to: volumePerFrame[endFrame - 1]!,
    });
    i = endFrame;
  }

  return segments;
}

/**
 * Escape commas for an FFmpeg filtergraph expression.
 */
function escapeFilterExpr(expr: string): string {
  return expr.replace(/,/g, "\\,");
}

/**
 * Format a gain literal for FFmpeg expressions.
 */
function fmtGain(value: number): string {
  if (Math.abs(value) < EPS) return "0";
  return Number(value.toFixed(6)).toString();
}

/**
 * Build a nested if(t) expression for piecewise-linear volume over composition time.
 */
export function buildVolumeExpression({
  segments,
  fps,
}: {
  segments: VolumeSegment[];
  fps: number;
}): string {
  if (segments.length === 0) return "0";

  const piece = (segment: VolumeSegment): string => {
    if (segment.type === "plateau") {
      return fmtGain(segment.gain);
    }
    // Samples span [startFrame, endFrame); last sample sits at endFrame - 1
    const t0 = segment.startFrame / fps;
    const tLast = (segment.endFrame - 1) / fps;
    const duration = tLast - t0;
    if (duration <= 0 || Math.abs(segment.to - segment.from) < EPS) {
      return fmtGain(segment.to);
    }
    // from + (to - from) * (t - t0) / duration
    return `${fmtGain(segment.from)}+(${fmtGain(segment.to)}-${fmtGain(segment.from)})*(t-${t0.toFixed(6)})/${duration.toFixed(6)}`;
  };

  // Nest from the end so earlier segments take precedence via lt(t, boundary)
  let expr = piece(segments[segments.length - 1]!);
  for (let i = segments.length - 2; i >= 0; i -= 1) {
    const boundary = segments[i]!.endFrame / fps;
    expr = `if(lt(t,${boundary.toFixed(6)}),${piece(segments[i]!)},${expr})`;
  }
  return expr;
}

/**
 * Compile a per-frame volume envelope into an FFmpeg volume filter fragment
 * (no trailing comma). Flat envelopes become a constant `volume=`; shaped
 * envelopes become `volume='…':eval=frame`.
 */
export function volumeFilterFromEnvelope({
  volumePerFrame,
  fps,
}: {
  volumePerFrame: number[];
  fps: number;
}): string {
  if (volumePerFrame.length === 0) {
    return "volume=0";
  }

  const segments = detectVolumeSegments(volumePerFrame);
  const nonZero = volumePerFrame.filter((v) => v > EPS);

  // Entirely silent
  if (nonZero.length === 0) {
    return "volume=0";
  }

  // Single constant gain across the whole composition (including leading/trailing zeros
  // only when every sample matches — rare). Prefer: all active samples equal AND no ramps.
  const onlyPlateaus =
    segments.length > 0 && segments.every((s) => s.type === "plateau");
  const distinctGains = new Set(
    segments
      .filter((s): s is VolumePlateau => s.type === "plateau")
      .map((s) => Number(s.gain.toFixed(4))),
  );

  // Flat non-zero gain with optional zero padding → constant volume (zeros outside
  // the clip window are handled by atrim / silence from adelay for most clips;
  // for mid-timeline zeros that matter we need the expression path).
  const hasInternalZeroDip =
    onlyPlateaus &&
    distinctGains.size > 1 &&
    [...distinctGains].some((g) => g < EPS) &&
    [...distinctGains].some((g) => g >= EPS);

  const isSingleFlatGain =
    onlyPlateaus &&
    !hasInternalZeroDip &&
    segments.filter((s) => s.type === "plateau" && s.gain >= EPS).every((s) => {
      const first = segments.find(
        (x) => x.type === "plateau" && x.gain >= EPS,
      ) as VolumePlateau | undefined;
      return first !== undefined && Math.abs(s.gain - first.gain) < EPS;
    }) &&
    segments.some((s) => s.type === "plateau" && s.gain >= EPS);

  // True flat envelope: every frame the same (including all-zero already handled)
  const allEqual = volumePerFrame.every(
    (v) => Math.abs(v - volumePerFrame[0]!) < EPS,
  );
  if (allEqual) {
    return `volume=${fmtGain(volumePerFrame[0]!)}`;
  }

  // Constant peak with only leading/trailing silence — safe as constant gain
  // because silence regions carry no signal (adelay / post-duration zeros).
  if (isSingleFlatGain && !hasInternalZeroDip) {
    const peak = segments.find(
      (s) => s.type === "plateau" && s.gain >= EPS,
    ) as VolumePlateau;
    // Ensure zeros only appear as a prefix and/or suffix
    const firstNonZero = volumePerFrame.findIndex((v) => v >= EPS);
    const lastNonZero =
      volumePerFrame.length -
      1 -
      [...volumePerFrame].reverse().findIndex((v) => v >= EPS);
    const middle = volumePerFrame.slice(firstNonZero, lastNonZero + 1);
    if (middle.every((v) => Math.abs(v - peak.gain) < EPS)) {
      return `volume=${fmtGain(peak.gain)}`;
    }
  }

  const expr = buildVolumeExpression({ segments, fps });
  return `volume='${escapeFilterExpr(expr)}':eval=frame`;
}
