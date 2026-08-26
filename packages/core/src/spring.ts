export type SpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
  overshootClamping?: boolean;
};

export type SpringArgs = {
  frame: number;
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
  /** If set, remaps the spring progress to complete in this many frames. */
  durationInFrames?: number;
};

/**
 * Frame-driven damped spring.
 *
 * Steps a classic mass-spring-damper ODE at 1/fps intervals:
 *   acceleration = (-stiffness * (pos - to) - damping * vel) / mass
 *
 * Returns the position at the given frame. Not wall-clock based.
 */
export function spring({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
  durationInFrames,
}: SpringArgs): number {
  const damping = config.damping ?? 10;
  const stiffness = config.stiffness ?? 100;
  const mass = config.mass ?? 1;
  const overshootClamping = config.overshootClamping ?? false;

  const dt = 1 / fps;
  let pos = from;
  let vel = 0;

  const steps =
    durationInFrames !== undefined
      ? Math.max(0, Math.floor(frame))
      : Math.max(0, Math.floor(frame));

  // If durationInFrames is set, run a fixed number of internal steps for progress 0..1
  const totalInternal =
    durationInFrames !== undefined ? Math.max(1, durationInFrames) : steps + 1;
  const runSteps =
    durationInFrames !== undefined
      ? Math.min(steps, totalInternal)
      : steps;

  for (let i = 0; i < runSteps; i++) {
    const force = -stiffness * (pos - to) - damping * vel;
    const acc = force / mass;
    vel += acc * dt;
    pos += vel * dt;
    if (overshootClamping) {
      if (from < to && pos > to) pos = to;
      if (from > to && pos < to) pos = to;
    }
  }

  if (durationInFrames !== undefined && frame >= durationInFrames) {
    return to;
  }

  return pos;
}
