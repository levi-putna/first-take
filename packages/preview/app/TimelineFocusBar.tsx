import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { TimelineViewport } from "./timelineZoom";

export type TimelineFocusChangeReason = "pan" | "zoom";

export type TimelineOverviewClip = {
  id: string;
  startFrame: number;
  durationInFrames: number;
};

/**
 * Clamps and normalises a viewport within the composition.
 */
export function clampTimelineViewport({
  startFrame,
  endFrame,
  durationInFrames,
  minVisibleFrames = 30,
}: {
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  minVisibleFrames?: number;
}): TimelineViewport {
  const maxFrame = Math.max(1, durationInFrames);
  const minSpan = Math.min(minVisibleFrames, maxFrame);
  let start = Math.round(startFrame);
  let end = Math.round(endFrame);

  if (end - start < minSpan) {
    end = start + minSpan;
  }
  if (end > maxFrame) {
    end = maxFrame;
    start = Math.max(0, end - minSpan);
  }
  if (start < 0) {
    start = 0;
    end = Math.min(maxFrame, start + Math.max(minSpan, end - start));
  }
  if (end <= start) {
    end = Math.min(maxFrame, start + minSpan);
  }
  return { startFrame: start, endFrame: end };
}

type DragMode = "move" | "start" | "end";

/**
 * Overview bar pinned to the bottom of the timeline.
 * Drag the window to pan; drag handles to zoom the visible span.
 */
export function TimelineFocusBar({
  durationInFrames,
  viewport,
  overviewClips = [],
  minVisibleFrames = 30,
  onViewportChange,
}: {
  durationInFrames: number;
  viewport: TimelineViewport;
  overviewClips?: TimelineOverviewClip[];
  minVisibleFrames?: number;
  onViewportChange?: (
    viewport: TimelineViewport,
    reason: TimelineFocusChangeReason,
  ) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    originX: number;
    originStart: number;
    originEnd: number;
  } | null>(null);
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const span = Math.max(1, durationInFrames);
  const clamped = clampTimelineViewport({
    ...viewport,
    durationInFrames: span,
    minVisibleFrames,
  });
  const leftPct = (clamped.startFrame / span) * 100;
  const widthPct = ((clamped.endFrame - clamped.startFrame) / span) * 100;
  const isFullWidth = clamped.startFrame <= 0 && clamped.endFrame >= span;

  const frameFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(1, rect.width);
      return ratio * span;
    },
    [span],
  );

  useEffect(() => {
    /**
     * Applies the active drag delta to the viewport.
     */
    function handlePointerMove(event: PointerEvent) {
      if (!dragRef.current || !onViewportChangeRef.current) return;
      const el = trackRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const deltaFrames =
        ((event.clientX - dragRef.current.originX) / Math.max(1, rect.width)) *
        span;
      const { mode, originStart, originEnd } = dragRef.current;
      const windowSpan = originEnd - originStart;

      if (mode === "move") {
        if (windowSpan >= span) return;
        onViewportChangeRef.current(
          clampTimelineViewport({
            startFrame: originStart + deltaFrames,
            endFrame: originStart + deltaFrames + windowSpan,
            durationInFrames: span,
            minVisibleFrames,
          }),
          "pan",
        );
        return;
      }

      if (mode === "start") {
        onViewportChangeRef.current(
          clampTimelineViewport({
            startFrame: originStart + deltaFrames,
            endFrame: originEnd,
            durationInFrames: span,
            minVisibleFrames,
          }),
          "zoom",
        );
        return;
      }

      onViewportChangeRef.current(
        clampTimelineViewport({
          startFrame: originStart,
          endFrame: originEnd + deltaFrames,
          durationInFrames: span,
          minVisibleFrames,
        }),
        "zoom",
      );
    }

    /**
     * Clears the active drag.
     */
    function handlePointerUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [minVisibleFrames, span]);

  /**
   * Starts a pan or resize drag on the focus window.
   */
  function beginDrag({
    event,
    mode,
  }: {
    event: ReactPointerEvent<HTMLElement>;
    mode: DragMode;
  }) {
    if (!onViewportChange) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      mode,
      originX: event.clientX,
      originStart: clamped.startFrame,
      originEnd: clamped.endFrame,
    };
  }

  /**
   * Jump-pans when clicking the overview outside the window.
   */
  function handleTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!onViewportChange) return;
    if (event.target !== event.currentTarget) return;
    const centre = frameFromClientX(event.clientX);
    const windowSpan = clamped.endFrame - clamped.startFrame;
    onViewportChange(
      clampTimelineViewport({
        startFrame: centre - windowSpan / 2,
        endFrame: centre + windowSpan / 2,
        durationInFrames: span,
        minVisibleFrames,
      }),
      "pan",
    );
  }

  // Layout: overview track · mini clips · focus window with resize handles
  return (
    <div className="sb-timeline-focus-track-wrap">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Timeline focus"
        aria-valuemin={0}
        aria-valuemax={span}
        aria-valuenow={clamped.startFrame}
        aria-valuetext={`Frames ${clamped.startFrame} to ${clamped.endFrame - 1}`}
        tabIndex={0}
        className="sb-timeline-focus-track"
        onPointerDown={handleTrackPointerDown}
        onKeyDown={(event) => {
          if (!onViewportChange) return;
          const step = Math.max(1, Math.round(span * 0.02));
          const windowSpan = clamped.endFrame - clamped.startFrame;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onViewportChange(
              clampTimelineViewport({
                startFrame: clamped.startFrame - step,
                endFrame: clamped.startFrame - step + windowSpan,
                durationInFrames: span,
                minVisibleFrames,
              }),
              "pan",
            );
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onViewportChange(
              clampTimelineViewport({
                startFrame: clamped.startFrame + step,
                endFrame: clamped.startFrame + step + windowSpan,
                durationInFrames: span,
                minVisibleFrames,
              }),
              "pan",
            );
          }
        }}
      >
        {overviewClips.map((clip) => (
          <div
            key={clip.id}
            aria-hidden
            className="sb-timeline-focus-clip"
            style={{
              left: `${(clip.startFrame / span) * 100}%`,
              width: `${(clip.durationInFrames / span) * 100}%`,
            }}
          />
        ))}

        <div
          className={`sb-timeline-focus-window${isFullWidth ? " is-full" : ""}`}
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          onPointerDown={(event) => beginDrag({ event, mode: "move" })}
        >
          <button
            type="button"
            aria-label="Resize timeline focus start"
            className="sb-timeline-focus-handle sb-timeline-focus-handle-start"
            onPointerDown={(event) => beginDrag({ event, mode: "start" })}
          />
          <button
            type="button"
            aria-label="Resize timeline focus end"
            className="sb-timeline-focus-handle sb-timeline-focus-handle-end"
            onPointerDown={(event) => beginDrag({ event, mode: "end" })}
          />
        </div>
      </div>
    </div>
  );
}
