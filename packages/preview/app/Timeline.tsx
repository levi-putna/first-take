import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  ArrowLeft,
  Pause,
  Play,
  SkipBack,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatFlooredTimecode, formatTimecode } from "./timecode";
import {
  TimelineFocusBar,
  type TimelineFocusChangeReason,
} from "./TimelineFocusBar";
import type { TimelineLane } from "./timelineModel";
import {
  clampPixelsPerFrame,
  defaultPixelsPerFrame,
  majorRulerStepFrames,
  minVisibleFrames,
  ppfFromVisibleFrames,
  scalePixelsPerFrame,
  viewportFromScroll,
  type TimelineViewport,
} from "./timelineZoom";

const LABEL_WIDTH = 96;
const RULER_HEIGHT = 28;

/**
 * Bottom editor dock: transport, zoomable time ruler, lanes, and focus bar.
 */
export function Timeline({
  frame,
  durationInFrames,
  fps,
  playing,
  muted,
  onPlayingChange,
  onMutedChange,
  onFrameChange,
  lanes,
  selectedSceneId,
  onSelectScene,
  onIsolateScene,
  isolated,
  onBack,
}: {
  frame: number;
  durationInFrames: number;
  fps: number;
  playing: boolean;
  muted: boolean;
  onPlayingChange: (next: boolean) => void;
  onMutedChange: (next: boolean) => void;
  onFrameChange: (next: number) => void;
  lanes: TimelineLane[];
  selectedSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onIsolateScene: (sceneId: string) => void;
  isolated: boolean;
  onBack: () => void;
}) {
  const last = Math.max(0, durationInFrames - 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const applyingFocusRef = useRef(false);
  const didInitZoomRef = useRef(false);
  const applyZoomRef = useRef<
    (args: {
      nextPpf: number;
      startFrame?: number;
      anchorFrame?: number;
      anchorOffsetPx?: number;
    }) => void
  >(() => {});
  const dragging = useRef(false);

  const [pixelsPerFrame, setPixelsPerFrame] = useState(1);
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollLeft: 0,
    clientWidth: 0,
  });

  const trackWidth = scrollMetrics.clientWidth;
  const contentWidth = durationInFrames * pixelsPerFrame;

  const overviewClips = useMemo(
    () =>
      lanes.flatMap((lane) =>
        lane.clips.map((clip) => ({
          id: clip.key,
          startFrame: clip.startFrame,
          durationInFrames: clip.durationInFrames,
        })),
      ),
    [lanes],
  );

  /**
   * Reads the current scroll container metrics into state.
   */
  const syncScrollMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollMetrics({
      scrollLeft: el.scrollLeft,
      clientWidth: el.clientWidth,
    });
  }, []);

  useLayoutEffect(() => {
    syncScrollMetrics();
  }, [syncScrollMetrics, pixelsPerFrame, durationInFrames]);

  useEffect(() => {
    didInitZoomRef.current = false;
  }, [durationInFrames]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    /**
     * Keeps the focus bar aligned while the user scrolls.
     */
    function handleScroll() {
      if (applyingFocusRef.current) return;
      syncScrollMetrics();
    }

    const observer = new ResizeObserver(() => {
      syncScrollMetrics();
    });
    observer.observe(el);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", handleScroll);
    };
  }, [syncScrollMetrics]);

  // Initialise default zoom once, then keep ppf inside duration-aware clamps.
  useLayoutEffect(() => {
    if (trackWidth <= 0) return;

    if (!didInitZoomRef.current) {
      didInitZoomRef.current = true;
      setPixelsPerFrame(
        defaultPixelsPerFrame({
          trackWidth,
          durationInFrames,
          fps,
        }),
      );
      return;
    }

    const clamped = clampPixelsPerFrame({
      pixelsPerFrame,
      trackWidth,
      durationInFrames,
      fps,
    });
    if (Math.abs(clamped - pixelsPerFrame) > 0.0005) {
      setPixelsPerFrame(clamped);
    }
  }, [durationInFrames, fps, pixelsPerFrame, trackWidth]);

  const viewport: TimelineViewport =
    trackWidth > 0
      ? viewportFromScroll({
          scrollLeft: scrollMetrics.scrollLeft,
          clientWidth: trackWidth,
          pixelsPerFrame,
          durationInFrames,
        })
      : { startFrame: 0, endFrame: durationInFrames };

  const focusMinVisible =
    trackWidth > 0
      ? minVisibleFrames({ trackWidth, fps })
      : Math.max(1, Math.round(2 * fps));

  /**
   * Converts a pointer X position inside the scrollport into a frame index.
   */
  const frameFromClientX = useCallback(
    (clientX: number) => {
      const el = scrollRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left + el.scrollLeft;
      const next = Math.round(x / Math.max(0.0001, pixelsPerFrame));
      return Math.max(0, Math.min(last, next));
    },
    [last, pixelsPerFrame],
  );

  const seekFromEvent = (event: MouseEvent<HTMLElement>) => {
    dragging.current = true;
    onFrameChange(frameFromClientX(event.clientX));
  };

  useEffect(() => {
    const onMove = (event: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      onFrameChange(frameFromClientX(event.clientX));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [frameFromClientX, onFrameChange]);

  /**
   * Applies a clamped zoom, optionally anchoring a frame under the cursor.
   */
  function applyZoom({
    nextPpf,
    startFrame,
    anchorFrame,
    anchorOffsetPx,
  }: {
    nextPpf: number;
    startFrame?: number;
    anchorFrame?: number;
    anchorOffsetPx?: number;
  }) {
    const el = scrollRef.current;
    if (!el) return;

    const clamped = clampPixelsPerFrame({
      pixelsPerFrame: nextPpf,
      trackWidth: el.clientWidth,
      durationInFrames,
      fps,
    });

    if (Math.abs(clamped - pixelsPerFrame) < 0.0005) return;

    applyingFocusRef.current = true;
    setPixelsPerFrame(clamped);

    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) {
        applyingFocusRef.current = false;
        return;
      }
      const maxScroll = Math.max(
        0,
        durationInFrames * clamped - scrollEl.clientWidth,
      );
      let nextScroll = scrollEl.scrollLeft;
      if (anchorFrame != null && anchorOffsetPx != null) {
        nextScroll = anchorFrame * clamped - anchorOffsetPx;
      } else if (startFrame != null) {
        nextScroll = startFrame * clamped;
      }
      scrollEl.scrollLeft = Math.min(maxScroll, Math.max(0, nextScroll));
      setScrollMetrics({
        scrollLeft: scrollEl.scrollLeft,
        clientWidth: scrollEl.clientWidth,
      });
      applyingFocusRef.current = false;
    });
  }

  applyZoomRef.current = applyZoom;

  // Vertical wheel / pinch zooms; horizontal wheel keeps native pan scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    /**
     * Zooms the timeline from wheel or trackpad pinch, anchored under the pointer.
     */
    function handleWheel(event: WheelEvent) {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      const isPinch = event.ctrlKey || event.metaKey;
      const isVerticalZoom = absY >= absX && absY > 0;

      if (!isPinch && !isVerticalZoom) return;

      event.preventDefault();

      let deltaY = event.deltaY;
      if (event.deltaMode === 1) deltaY *= 16;
      if (event.deltaMode === 2) deltaY *= scrollEl.clientWidth;

      const factor = Math.exp(-deltaY * 0.0018);
      const rect = scrollEl.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const anchorFrame =
        (scrollEl.scrollLeft + offsetX) / Math.max(0.0001, pixelsPerFrame);

      applyZoomRef.current({
        nextPpf: scalePixelsPerFrame({
          pixelsPerFrame,
          factor,
          trackWidth: scrollEl.clientWidth,
          durationInFrames,
          fps,
        }),
        anchorFrame,
        anchorOffsetPx: offsetX,
      });
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [durationInFrames, fps, pixelsPerFrame]);

  /**
   * Pans without changing zoom.
   */
  function applyPan({ startFrame }: { startFrame: number }) {
    const el = scrollRef.current;
    if (!el) return;
    applyingFocusRef.current = true;
    const maxScroll = Math.max(
      0,
      durationInFrames * pixelsPerFrame - el.clientWidth,
    );
    el.scrollLeft = Math.min(maxScroll, Math.max(0, startFrame * pixelsPerFrame));
    setScrollMetrics({
      scrollLeft: el.scrollLeft,
      clientWidth: el.clientWidth,
    });
    applyingFocusRef.current = false;
  }

  /**
   * Routes focus-bar updates to pan-only or zoom paths.
   */
  function handleViewportChange(
    next: TimelineViewport,
    reason: TimelineFocusChangeReason,
  ) {
    if (reason === "pan") {
      applyPan({ startFrame: next.startFrame });
      return;
    }

    const visibleFrames = Math.max(1, next.endFrame - next.startFrame);
    const el = scrollRef.current;
    if (!el) return;
    applyZoom({
      nextPpf: ppfFromVisibleFrames({
        trackWidth: el.clientWidth,
        visibleFrames,
      }),
      startFrame: next.startFrame,
    });
  }

  const majorStep = majorRulerStepFrames({ pixelsPerFrame, fps });
  const ticks: number[] = [];
  for (let f = 0; f <= durationInFrames; f += majorStep) {
    ticks.push(f);
  }

  const playheadLeft = frame * pixelsPerFrame;

  return (
    <div className="sb-dock">
      {/* Play / pause + timecode */}
      <div className="sb-transport">
        {isolated ? (
          <button
            type="button"
            className="sb-icon-btn"
            aria-label="Back to full timeline"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className="sb-icon-btn"
          aria-label="Go to start"
          onClick={() => {
            onPlayingChange(false);
            onFrameChange(0);
          }}
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          className="sb-icon-btn"
          aria-pressed={playing}
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => onPlayingChange(!playing)}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          className="sb-icon-btn"
          aria-pressed={muted}
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => onMutedChange(!muted)}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <span className="sb-mono">
          {formatTimecode({ frame, fps })} / {formatTimecode({ frame: last, fps })}
        </span>
        <span className="sb-mono">f{frame}</span>
      </div>

      {/* Ruler + lanes (scroll vertically when dock is short) */}
      <div className="sb-timeline-body">
        <div className="sb-timeline-panel">
          <div className="sb-timeline">
            <div className="sb-timeline-labels" style={{ width: LABEL_WIDTH }}>
              <div
                className="sb-timeline-label-gutter"
                style={{ height: RULER_HEIGHT }}
              />
              {lanes.map((lane) => (
                <div key={lane.trackId} className="sb-timeline-label">
                  {lane.title}
                </div>
              ))}
            </div>

            {/* Scrollport: native scrollbar hidden; focus bar is the scroll UI */}
            <div ref={scrollRef} className="sb-timeline-scroll">
              <div
                className="sb-timeline-stack"
                style={{ width: contentWidth }}
              >
                {/* Time ruler */}
                <div
                  className="sb-ruler"
                  style={{ height: RULER_HEIGHT }}
                  onMouseDown={seekFromEvent}
                  role="slider"
                  aria-label="Timeline"
                  aria-valuemin={0}
                  aria-valuemax={last}
                  aria-valuenow={frame}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      onFrameChange(Math.max(0, frame - 1));
                    }
                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      onFrameChange(Math.min(last, frame + 1));
                    }
                  }}
                >
                  {ticks.map((tick) => (
                    <div
                      key={tick}
                      className="sb-ruler-tick"
                      style={{ left: tick * pixelsPerFrame }}
                    >
                      <span>{formatFlooredTimecode({ frame: tick, fps })}</span>
                    </div>
                  ))}
                </div>

                {lanes.map((lane, laneIndex) => (
                  <div key={lane.trackId} className="sb-lane">
                    {lane.clips.map((clip) => (
                      <button
                        key={clip.key}
                        type="button"
                        className={`sb-clip${selectedSceneId === clip.sceneId ? " is-current" : ""}`}
                        style={{
                          left: clip.startFrame * pixelsPerFrame,
                          width: clip.durationInFrames * pixelsPerFrame,
                          background: clipTone(laneIndex),
                        }}
                        title={`${clip.title} · ${clip.durationInFrames}f`}
                        onClick={() => onSelectScene(clip.sceneId)}
                        onDoubleClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onIsolateScene(clip.sceneId);
                        }}
                      >
                        {clip.title}
                      </button>
                    ))}
                  </div>
                ))}

                {/* Playhead overlay: diamond in ruler, stem through lanes */}
                <div className="sb-playhead" style={{ left: playheadLeft }}>
                  <div
                    className="sb-playhead-diamond"
                    style={{ top: RULER_HEIGHT }}
                    onMouseDown={seekFromEvent}
                  />
                  <div
                    className="sb-playhead-stem"
                    style={{ top: RULER_HEIGHT }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Focus bar: full-width pan/zoom overview pinned to the dock bottom */}
        <div className="sb-timeline-focus">
          <TimelineFocusBar
            durationInFrames={durationInFrames}
            viewport={viewport}
            overviewClips={overviewClips}
            minVisibleFrames={focusMinVisible}
            onViewportChange={handleViewportChange}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Quiet alternating lane colours.
 */
function clipTone(laneIndex: number): string {
  return laneIndex % 2 === 0 ? "var(--scene-a)" : "var(--scene-b)";
}
