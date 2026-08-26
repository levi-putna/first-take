/**
 * Built-in easing functions for interpolate().
 */
export const Easing = {
  linear: (t: number) => t,
  /**
   * Cubic bezier easing matching CSS cubic-bezier(x1, y1, x2, y2).
   * Approximates the curve via Newton-Raphson on the x axis.
   */
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    return (t: number): number => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;

      // Sample bezier X for parameter u, solve for u given t
      let u = t;
      for (let i = 0; i < 8; i++) {
        const currentX = cubicBezier(u, x1, x2);
        const dx = currentX - t;
        if (Math.abs(dx) < 1e-6) break;
        const d = cubicBezierDerivative(u, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        u -= dx / d;
        u = Math.min(1, Math.max(0, u));
      }
      return cubicBezier(u, y1, y2);
    };
  },
  in: (easing: (t: number) => number) => easing,
  out:
    (easing: (t: number) => number) =>
    (t: number): number =>
      1 - easing(1 - t),
  inOut:
    (easing: (t: number) => number) =>
    (t: number): number =>
      t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
} as const;

function cubicBezier(t: number, a: number, b: number): number {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
}

function cubicBezierDerivative(t: number, a: number, b: number): number {
  const u = 1 - t;
  return 3 * u * u * a + 6 * u * t * (b - a) + 3 * t * t * (1 - b);
}
