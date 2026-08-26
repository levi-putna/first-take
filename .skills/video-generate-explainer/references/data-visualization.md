# Data visualization in video (charts, graphs, dashboards)

Guidance for any scene whose `visualNotes` (Gate 3) calls for a chart,
graph, counter, or other data graphic. Read this before building that
scene at Gate 6, and treat it as an extension of
[design-and-continuity.md](design-and-continuity.md)'s relevance/one-focus/
motion-restraint rules, applied specifically to data graphics.

## Default to plain React/SVG; reach for visx only when the data needs it

Most on-screen numbers in a short explainer are **not** a chart - a single
stat, a percentage, a before/after pair, a short ranked list. Build those
as plain `div`/`svg` JSX styled from `shared/theme.ts`, animated the same
way as everything else (`interpolate()`/`spring()`). Don't reach for a
charting library to draw a bar you could draw with one `<div>`.

Reach for [visx](https://visx.airbnb.tech) (`@visx/*`, from Airbnb) once
the scene genuinely needs real chart geometry: multiple data points on a
scale, an axis, a curve, more than a couple of series. visx is a
collection of **low-level, unopinionated** primitives (`@visx/shape`,
`@visx/scale`, `@visx/group`, `@visx/axis`, `@visx/grid`, `@visx/curve`,
`@visx/gradient`) built on d3 - it computes the geometry (scales, paths,
ticks) and hands you plain SVG elements to style and animate yourself,
which is exactly the shape this skill needs.

```bash
# install only when a scene actually needs chart geometry, not up front:
npm install @visx/shape @visx/scale @visx/group @visx/axis @visx/grid @visx/curve
```

### Critical: do not use visx's built-in animation - it breaks Remotion's frame determinism

visx's high-level `@visx/xychart` package ships `Animated*` components
(`AnimatedLineSeries`, `AnimatedAxis`, `AnimatedGrid`, etc.) that animate
via **`react-spring`**, a real-time/wall-clock physics library. That is
the same class of forbidden behaviour as CSS transitions (Hard rule 6):
it is not driven by `useCurrentFrame()`, so it will not render
deterministically frame-by-frame and can desync, flicker, or freeze
mid-motion on export.

**Rule for this skill:**

- Use only the **low-level, non-animated** visx primitives (`LinePath`,
  `AreaClosed`, `Bar`, `Pie`, `AxisBottom`/`AxisLeft`, `GridRows`/
  `GridColumns`, `Group`, `scaleLinear`/`scaleBand`/`scaleTime` from
  `@visx/scale`). These render plain, static SVG from your data - no
  animation baked in, by design (this is an explicit visx design choice,
  not a limitation).
- Never import `@visx/xychart`'s `Animated*` components, and never add
  `react-spring` as a dependency for this skill.
- Drive **all** motion yourself the normal way: read `frame` via
  `useCurrentFrame()`, compute a progress value with `interpolate()` (or
  `spring()` for the entrance), and apply it as a prop/style on the visx
  primitive (see patterns below). This keeps charts inside the same
  deterministic render model as every other scene.

## Line/draw-on pattern (the core technique)

The most useful chart animation - a line "drawing itself in" - is done
with `strokeDasharray`/`strokeDashoffset`, driven by `interpolate()`, not
any chart-library animation prop:

```tsx
import { useRef, useLayoutEffect, useState } from "react";
import { LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { motion } from "../shared/theme";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const pathRef = useRef<SVGPathElement>(null);
const [length, setLength] = useState(0);

useLayoutEffect(() => {
  if (pathRef.current) setLength(pathRef.current.getTotalLength());
}, [data]);

const drawn = interpolate(frame, [0, 1.2 * fps], [0, length], {
  extrapolateRight: "clamp",
});

<LinePath
  innerRef={pathRef}
  data={data}
  x={(d) => xScale(d.x)}
  y={(d) => yScale(d.y)}
  curve={curveMonotoneX}
  stroke={theme.colors.accent}
  strokeWidth={3}
  strokeDasharray={length}
  strokeDashoffset={length - drawn}
/>;
```

The same `strokeDasharray`/`strokeDashoffset` technique works for
`AreaClosed` outlines and `Pie`/arc paths. For bars, animate `height`/`y`
directly with `interpolate()`/`spring()` instead (no dash trick needed).

## Categories, and what actually works for each

### Line / area charts (trend over time)

The category the user is most likely to reach for, and the easiest to get
wrong in video specifically:

- **Print vs. video is a real difference, not a style preference.** A
  print/dashboard chart is read at the viewer's own pace - they can linger,
  scan every tick label, cross-reference a legend. A video chart is on
  screen for a few seconds and never comes back. Design for a glance, not
  a study:
  - Fewer data points than you'd use in print - simplify/smooth the series
    rather than plotting every raw sample.
  - Thicker strokes (3-4px+ at 1080p) than a dashboard would use.
  - Fewer gridlines, or none - a light `GridRows`/`GridColumns` at most;
    dense tick marks read as noise at video pace.
  - Label the **line itself** at its end (value + short label) instead of
    a legend the eye has to jump to. See "Attention" below.
  - Draw the line on with the technique above rather than presenting it
    fully-formed - motion gives the eye a path to follow instead of
    forcing it to parse a static shape cold.
  - The chart is supporting evidence for the narration's number, not the
    primary channel - put the headline number in `onScreenText` or a
    counter (below), let the line just show *shape* (going up, going down,
    the inflection point that matters).
- Use `curveMonotoneX`/`curveNatural` from `@visx/curve` for a smooth,
  legible trend line unless the data is genuinely jagged and that jaggedness
  is the point.

### Bar / column charts (comparing categories)

- Grow bars from the baseline (`interpolate()` on height/scaleY, or
  `spring()` for a touch of overshoot on the *one* bar being emphasised
  only) - a short stagger between bars (2-3 frames each) reads as
  intentional; more than that starts to feel slow.
- Cap at **6-8 bars** on screen at once. More than that in a few seconds
  of video is not absorbable - group into an "other" bucket, or split
  across two scenes if every category truly matters.
- Label each bar's value directly above/beside it rather than requiring
  an axis read - direct labels survive being watched on a phone at low
  resolution; a left-axis scale often doesn't.

### Pie / donut charts (part-to-whole)

- Use sparingly - pie charts are hard to read at a glance even in print,
  and video removes the option to linger and compare slice angles. Prefer
  a single stat ("73% of users...") or a simple stacked bar unless the
  *shape* of the whole (not just one slice) is genuinely the point.
- If you do use one: **max 3-4 slices**, sweep the arc on (dasharray
  technique above) rather than spinning/rotating the whole shape in, and
  label the one slice that matters directly on/next to it rather than a
  side legend.

### Scatter / bubble (correlation, distribution)

- Rare in a short explainer - only reach for this when correlation between
  two variables is literally the message. Animate points fading/scaling
  in with a short stagger (`spring()`), highlight the one point/cluster
  the narration is about, mute the rest to a lower-contrast neutral.

### Single-stat counters and KPI call-outs

Often a better choice than a full chart when the message is "one number
went up" rather than "here's the trend shape":

```tsx
const value = interpolate(frame, [0, 1 * fps], [startValue, endValue], {
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
<span>{Math.round(value).toLocaleString()}</span>;
```

Time the count so it **lands on the exact end value at (or slightly
before) the narration's beat about that number** - a counter still
ticking when the scene cuts reads as broken, not dynamic.

### Progress / gauge indicators

- Animate the fill/sweep with `interpolate()` against an SVG arc or bar,
  same dasharray technique as above. Keep to one gauge per scene; a bank
  of gauges is a dashboard, not an explainer beat.

## Focusing attention (don't make the viewer hunt for the point)

- **Highlight exactly one series/point/segment per scene** with a single
  accent colour from `shared/theme.ts`; render every other series/segment
  in a low-contrast neutral. Equal saturation across every series is the
  most common reason a chart reads as "busy" rather than "clear."
- **Annotate the point that matters directly on the chart** - a labelled
  dot, a short callout line, a highlighted end-value - timed to appear
  when the narration actually says it, not dumped on screen from frame 0.
- **Don't plot more than the narration references.** If the script only
  talks about two of five available series, show two - cutting the rest
  is not "losing data," it's doing the viewer's filtering for them.
- **Prefer direct labelling over legends.** A legend forces a two-step
  read (find the colour in the legend, then find it in the chart); a
  direct label on the line/bar/slice is a one-step read. Use a legend
  only when direct labelling would visually collide (many close values).

## Keep it simple - hard ceilings

If a chart needs more than this to make its point, split the idea across
scenes or simplify the underlying data - don't cram more complexity into
one graphic:

- ≤4 data series in a single chart.
- ≤6-8 categories/bars/slices.
- ≤6 tick marks per axis (or omit the axis and label points directly).
- No dual-axis charts (ambiguous even in print; worse at video pace).
- No 3D charts, drop shadows, textured/gradient fills "for polish" - flat,
  theme-token colours only. If a chart needs its own legend just to
  explain what the colours mean beyond what a direct label could, that's
  usually a sign it's carrying too many series for this format.
- Every colour used in a chart comes from `shared/theme.ts`, same as any
  other component (design-and-continuity.md's "no literal hex values"
  rule applies here too).

## Reuse across scenes and productions

A chart component built for one scene is a strong candidate for the
cross-production shared library if the same shape of chart (e.g. "a
labelled trend line," "a single KPI counter") is likely to recur - see
[reusable-components.md](reusable-components.md) for the promotion
criteria and where a shared chart primitive lives
(`remotion/shared/charts/`).
