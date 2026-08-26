/**
 * Extrapolation behaviour outside the input range.
 */
export type ExtrapolateType = "extend" | "clamp" | "identity";

export type InterpolateOptions = {
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
  easing?: (t: number) => number;
};

function extrapolate({
  value,
  inputMin,
  inputMax,
  side,
  mode,
}: {
  value: number;
  inputMin: number;
  inputMax: number;
  side: "left" | "right";
  mode: ExtrapolateType;
}): number {
  if (mode === "clamp") {
    return side === "left" ? inputMin : inputMax;
  }
  if (mode === "identity") {
    return value;
  }
  return value;
}

/**
 * Map an input through piecewise-linear ranges with optional easing and clamp.
 */
export function interpolate(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options: InterpolateOptions = {},
): number {
  if (inputRange.length !== outputRange.length) {
    throw new Error("inputRange and outputRange must have the same length");
  }
  if (inputRange.length < 2) {
    throw new Error("inputRange must have at least 2 points");
  }

  const extrapolateLeft = options.extrapolateLeft ?? "extend";
  const extrapolateRight = options.extrapolateRight ?? "extend";
  const easing = options.easing ?? ((t: number) => t);

  const first = inputRange[0];
  const last = inputRange[inputRange.length - 1];

  let x = input;
  if (x < first) {
    x = extrapolate({
      value: x,
      inputMin: first,
      inputMax: last,
      side: "left",
      mode: extrapolateLeft,
    });
    if (extrapolateLeft === "clamp") {
      return outputRange[0];
    }
    if (extrapolateLeft === "identity") {
      return input;
    }
  }
  if (x > last) {
    x = extrapolate({
      value: x,
      inputMin: first,
      inputMax: last,
      side: "right",
      mode: extrapolateRight,
    });
    if (extrapolateRight === "clamp") {
      return outputRange[outputRange.length - 1];
    }
    if (extrapolateRight === "identity") {
      return input;
    }
  }

  // Find segment
  let i = 0;
  for (; i < inputRange.length - 1; i++) {
    if (x >= inputRange[i] && x <= inputRange[i + 1]) break;
  }
  if (i >= inputRange.length - 1) i = inputRange.length - 2;

  const i0 = inputRange[i];
  const i1 = inputRange[i + 1];
  const o0 = outputRange[i];
  const o1 = outputRange[i + 1];
  const span = i1 - i0;
  const t = span === 0 ? 0 : (x - i0) / span;
  const eased = easing(Math.min(1, Math.max(0, t)));
  return o0 + (o1 - o0) * eased;
}
