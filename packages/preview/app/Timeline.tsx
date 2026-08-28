import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowLeft,
  GripVertical,
  Pause,
  Play,
  Plus,
  Redo2,
  SkipBack,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  decimalsForTickFrames,
  formatFlooredTimecode,
  formatTimecode,
} from "./timecode";
import {
  TimelineFocusBar,
  type TimelineFocusChangeReason,
} from "./TimelineFocusBar";
import type { TimelineClip, TimelineLane } from "./timelineModel";
import type { SceneAudioClip } from "../src/scene-audio-parse";
import { ClipWaveform } from "./ClipWaveform";
import {
  clampPixelsPerFrame,
  defaultPixelsPerFrame,
  durationFromTrimPointer,
  majorRulerStepFrames,
  minVisibleFrames,
  ppfFromVisibleFrames,
  scalePixelsPerFrame,
  scrollableDurationInFrames,
  timelineContentWidth,
  trimEdgeScrollDeltaPx,
  viewportFromScroll,
  type TimelineViewport,
} from "./timelineZoom";
import { moveIndex, targetIndexFromDelta } from "./timelineEdit";
import {
  clampLabelColumnWidth,
  LABEL_COLUMN_KEYBOARD_STEP,
  LABEL_COLUMN_MAX_WIDTH,
  labelColumnDefaultWidth,
  labelColumnMinWidth,
  persistLabelColumnWidth,
  readStoredLabelColumnWidth,
} from "./dockLayout";

const RULER_HEIGHT = 28;
const DRAG_THRESHOLD_PX = 4;
const TRIM_HANDLE_PX = 12;
/** Clips narrower than this cannot be moved, trimmed, or selected. */
const MIN_CLIP_INTERACT_PX = 12;

type ClipDragMode = "move" | "trim-end";

type ClipDragState = {
  mode: ClipDragMode;
  sceneId: string;
  sourceTrackId: string;
  originX: number;
  originStart: number;
  originDuration: number;
  moved: boolean;
  previewStart: number;
  previewDuration: number;
  targetTrackId: string;
  lastClientX: number;
  pendingScroll: number | null;
  pointerId: number;
};

type TrackReorderState = {
  trackId: string;
  fromIndex: number;
  originY: number;
  originOrder: string[];
  previewOrder: string[];
  laneHeight: number;
  moved: boolean;
};

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
  selectedTrackId,
  onSelectScene,
  onSelectTrack,
  onIsolateScene,
  isolated,
  onBack,
  editable = false,
  onMoveScene,
  onTrimScene,
  dropTargetTrackId = null,
  onDropTargetTrackChange,
  onAddTrack,
  onReorderTracks,
  canUndo = false,
  canRedo = false,
  undoHint = "Undo",
  redoHint = "Redo",
  onUndo,
  onRedo,
  sceneAudio = {},
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
  selectedSceneId: string | null;
  selectedTrackId: string | null;
  onSelectScene: (sceneId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onIsolateScene: (sceneId: string) => void;
  isolated: boolean;
  onBack: () => void;
  editable?: boolean;
  onMoveScene?: (args: {
    sceneId: string;
    targetTrackId: string;
    startFrame: number;
  }) => void;
  onTrimScene?: (args: {
    sceneId: string;
    durationInFrames: number;
  }) => void;
  dropTargetTrackId?: string | null;
  onDropTargetTrackChange?: (trackId: string | null) => void;
  onAddTrack?: () => void;
  onReorderTracks?: (args: { trackIds: string[] }) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoHint?: string;
  redoHint?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Audio sources detected for each scene, used to paint clip waveforms. */
  sceneAudio?: Record<string, SceneAudioClip[]>;
}) {
  const last = Math.max(0, durationInFrames - 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const laneRefs = useRef<Map<string, HTMLDivElement>>(new Map());
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
  const clipDragRef = useRef<ClipDragState | null>(null);
  const trimRafRef = useRef(0);
  const pixelsPerFrameRef = useRef(1);
  const trackReorderRef = useRef<TrackReorderState | null>(null);
  const onMoveSceneRef = useRef(onMoveScene);
  const onTrimSceneRef = useRef(onTrimScene);
  const onDropTargetTrackChangeRef = useRef(onDropTargetTrackChange);
  const onSelectSceneRef = useRef(onSelectScene);
  const onSelectTrackRef = useRef(onSelectTrack);
  const onReorderTracksRef = useRef(onReorderTracks);
  const lanesRef = useRef(lanes);
  onMoveSceneRef.current = onMoveScene;
  onTrimSceneRef.current = onTrimScene;
  onDropTargetTrackChangeRef.current = onDropTargetTrackChange;
  onSelectSceneRef.current = onSelectScene;
  onSelectTrackRef.current = onSelectTrack;
  onReorderTracksRef.current = onReorderTracks;
  lanesRef.current = lanes;

  const [pixelsPerFrame, setPixelsPerFrame] = useState(1);
  pixelsPerFrameRef.current = pixelsPerFrame;
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollLeft: 0,
    clientWidth: 0,
  });
  const [clipPreview, setClipPreview] = useState<{
    sceneId: string;
    trackId: string;
    startFrame: number;
    durationInFrames: number;
  } | null>(null);
  const [trackOrderPreview, setTrackOrderPreview] = useState<string[] | null>(
    null,
  );

  const canReorderTracks = editable && !isolated && lanes.length > 1;
  const [labelWidth, setLabelWidth] = useState(
    () =>
      readStoredLabelColumnWidth() ??
      labelColumnDefaultWidth({ canReorderTracks }),
  );
  const [labelResizing, setLabelResizing] = useState(false);
  const labelResizeStart = useRef({
    x: 0,
    width: labelColumnDefaultWidth({ canReorderTracks: false }),
  });
  const canReorderTracksRef = useRef(canReorderTracks);
  canReorderTracksRef.current = canReorderTracks;
  const displayLanes = useMemo(() => {
    if (!trackOrderPreview) return lanes;
    const byId = new Map(lanes.map((lane) => [lane.trackId, lane]));
    return trackOrderPreview.flatMap((trackId) => {
      const lane = byId.get(trackId);
      return lane ? [lane] : [];
    });
  }, [lanes, trackOrderPreview]);

  const trackWidth = scrollMetrics.clientWidth;
  const previewEnd =
    clipPreview != null
      ? clipPreview.startFrame + clipPreview.durationInFrames
      : 0;
  const stackDurationInFrames = Math.max(durationInFrames, previewEnd);
  const contentWidth = timelineContentWidth({
    durationInFrames: stackDurationInFrames,
    pixelsPerFrame,
    trackWidth,
  });
  const scrollableDuration = scrollableDurationInFrames({
    durationInFrames: stackDurationInFrames,
    trackWidth,
    pixelsPerFrame,
  });

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
  }, [syncScrollMetrics, pixelsPerFrame, durationInFrames, contentWidth]);

  /**
   * Clamp the track-name column against the current panel and grip state.
   */
  const applyLabelWidth = useCallback(
    ({ width }: { width: number }) => {
      const next = clampLabelColumnWidth({
        width,
        panelWidth: panelRef.current?.clientWidth ?? 0,
        canReorderTracks: canReorderTracksRef.current,
      });
      setLabelWidth(next);
      return next;
    },
    [],
  );

  /**
   * Keep the column inside min/max when the dock or grip availability changes.
   */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    function clampToPanel() {
      setLabelWidth((current) =>
        clampLabelColumnWidth({
          width: current,
          panelWidth: panelRef.current?.clientWidth ?? 0,
          canReorderTracks: canReorderTracksRef.current,
        }),
      );
    }

    clampToPanel();
    const observer = new ResizeObserver(clampToPanel);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [canReorderTracks]);

  /**
   * Start a drag-resize on the track-name column.
   */
  function beginLabelColumnResize({
    event,
  }: {
    event: ReactPointerEvent<HTMLButtonElement>;
  }) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    labelResizeStart.current = { x: event.clientX, width: labelWidth };
    setLabelResizing(true);
  }

  /**
   * Follow the pointer while the track-name column is being resized.
   */
  function handleLabelResizeMove({
    event,
  }: {
    event: ReactPointerEvent<HTMLButtonElement>;
  }) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const delta = event.clientX - labelResizeStart.current.x;
    applyLabelWidth({ width: labelResizeStart.current.width + delta });
  }

  /**
   * Persist the column width when the resize pointer is released.
   */
  function finishLabelColumnResize({
    event,
  }: {
    event: ReactPointerEvent<HTMLButtonElement>;
  }) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setLabelResizing(false);
    setLabelWidth((current) => {
      persistLabelColumnWidth({ width: current });
      return current;
    });
  }

  /**
   * Keyboard alternative to dragging the track-name column.
   */
  function handleLabelResizeKey({
    event,
  }: {
    event: ReactKeyboardEvent<HTMLButtonElement>;
  }) {
    let next = labelWidth;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      next = labelWidth - LABEL_COLUMN_KEYBOARD_STEP;
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next = labelWidth + LABEL_COLUMN_KEYBOARD_STEP;
    } else if (event.key === "Home") {
      event.preventDefault();
      next = labelColumnMinWidth({ canReorderTracks });
    } else if (event.key === "End") {
      event.preventDefault();
      next = LABEL_COLUMN_MAX_WIDTH;
    } else {
      return;
    }
    persistLabelColumnWidth({ width: applyLabelWidth({ width: next }) });
  }

  /**
   * Reset the track-name column to the logical default.
   */
  function resetLabelColumnWidth() {
    persistLabelColumnWidth({
      width: applyLabelWidth({
        width: labelColumnDefaultWidth({ canReorderTracks }),
      }),
    });
  }
  const prevIsolatedRef = useRef(isolated);
  useLayoutEffect(() => {
    if (prevIsolatedRef.current === isolated) return;
    prevIsolatedRef.current = isolated;
    didInitZoomRef.current = false;
  }, [isolated]);

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
  }, [durationInFrames, fps, pixelsPerFrame, trackWidth, isolated]);

  const viewport: TimelineViewport =
    trackWidth > 0
      ? viewportFromScroll({
          scrollLeft: scrollMetrics.scrollLeft,
          clientWidth: trackWidth,
          pixelsPerFrame,
          durationInFrames: scrollableDuration,
        })
      : { startFrame: 0, endFrame: scrollableDuration };

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

  /**
   * Resolve which lane is under the pointer.
   */
  const trackIdFromClientY = useCallback((clientY: number) => {
    for (const lane of lanesRef.current) {
      const el = laneRefs.current.get(lane.trackId);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return lane.trackId;
      }
    }
    return lanesRef.current[0]?.trackId ?? "";
  }, []);

  const seekFromEvent = (event: MouseEvent<HTMLElement>) => {
    if (clipDragRef.current) return;
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

  useEffect(() => {
    if (!editable) return;

    /**
     * Maps the current pointer to a trim-end duration, then auto-scrolls
     * when the pointer sits in the scrollport edge so the clip can keep growing.
     */
    function applyTrimFromPointer({
      drag,
      scrollLeft,
    }: {
      drag: ClipDragState;
      scrollLeft: number;
    }) {
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const duration = durationFromTrimPointer({
        clientX: drag.lastClientX,
        viewportLeft: rect.left,
        viewportWidth: el.clientWidth,
        scrollLeft,
        pixelsPerFrame: pixelsPerFrameRef.current,
        startFrame: drag.originStart,
      });
      drag.previewDuration = duration;
      setClipPreview({
        sceneId: drag.sceneId,
        trackId: drag.sourceTrackId,
        startFrame: drag.originStart,
        durationInFrames: duration,
      });
    }

    /**
     * Continues a trim while the pointer is held in the edge zone, even if still.
     */
    function tickTrimEdgeScroll() {
      const drag = clipDragRef.current;
      const el = scrollRef.current;
      if (!drag || drag.mode !== "trim-end" || !drag.moved || !el) {
        trimRafRef.current = 0;
        return;
      }

      const rect = el.getBoundingClientRect();
      const deltaPx = trimEdgeScrollDeltaPx({
        clientX: drag.lastClientX,
        viewportLeft: rect.left,
        viewportRight: rect.right,
      });
      if (deltaPx !== 0) {
        const nextScroll = Math.max(0, el.scrollLeft + deltaPx);
        drag.pendingScroll = nextScroll;
        applyTrimFromPointer({ drag, scrollLeft: nextScroll });
      }
      trimRafRef.current = requestAnimationFrame(tickTrimEdgeScroll);
    }

    /**
     * Starts the edge-scroll loop once a trim is past the click threshold.
     */
    function startTrimEdgeScroll() {
      if (trimRafRef.current) return;
      trimRafRef.current = requestAnimationFrame(tickTrimEdgeScroll);
    }

    /**
     * Drag or trim a clip while the pointer is down.
     */
    function handlePointerMove(event: PointerEvent) {
      if (trackReorderRef.current) return;
      const drag = clipDragRef.current;
      if (!drag) return;

      drag.lastClientX = event.clientX;
      const deltaX = event.clientX - drag.originX;
      if (!drag.moved && Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
        return;
      }
      drag.moved = true;

      if (drag.mode === "move") {
        const deltaFrames = Math.round(
          deltaX / Math.max(0.0001, pixelsPerFrameRef.current),
        );
        const targetTrackId = trackIdFromClientY(event.clientY);
        drag.targetTrackId = targetTrackId;
        drag.previewStart = Math.max(0, drag.originStart + deltaFrames);
        onDropTargetTrackChangeRef.current?.(targetTrackId);
        setClipPreview({
          sceneId: drag.sceneId,
          trackId: targetTrackId,
          startFrame: drag.previewStart,
          durationInFrames: drag.originDuration,
        });
        return;
      }

      const el = scrollRef.current;
      applyTrimFromPointer({
        drag,
        scrollLeft: el?.scrollLeft ?? 0,
      });
      startTrimEdgeScroll();
    }

    /**
     * Commit or cancel the active clip drag.
     */
    function finishPointer(event?: Event) {
      const drag = clipDragRef.current;
      if (
        event &&
        "pointerId" in event &&
        drag &&
        (event as PointerEvent).pointerId !== drag.pointerId
      ) {
        return;
      }

      if (trimRafRef.current) {
        cancelAnimationFrame(trimRafRef.current);
        trimRafRef.current = 0;
      }

      clipDragRef.current = null;
      onDropTargetTrackChangeRef.current?.(null);
      setClipPreview(null);

      if (!drag) return;

      if (!drag.moved) {
        onSelectSceneRef.current(drag.sceneId);
        return;
      }

      if (drag.mode === "move") {
        onMoveSceneRef.current?.({
          sceneId: drag.sceneId,
          targetTrackId: drag.targetTrackId,
          startFrame: drag.previewStart,
        });
        return;
      }

      onTrimSceneRef.current?.({
        sceneId: drag.sceneId,
        durationInFrames: drag.previewDuration,
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishPointer);
    window.addEventListener("pointercancel", finishPointer);
    window.addEventListener("lostpointercapture", finishPointer);
    return () => {
      if (trimRafRef.current) {
        cancelAnimationFrame(trimRafRef.current);
        trimRafRef.current = 0;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointer);
      window.removeEventListener("pointercancel", finishPointer);
      window.removeEventListener("lostpointercapture", finishPointer);
    };
  }, [editable, trackIdFromClientY]);

  /**
   * Apply auto-scroll after the stack grows so the browser does not clamp it.
   */
  useLayoutEffect(() => {
    const drag = clipDragRef.current;
    const el = scrollRef.current;
    if (!drag || drag.mode !== "trim-end" || drag.pendingScroll == null || !el) {
      return;
    }

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const nextScroll = Math.min(maxScroll, drag.pendingScroll);
    drag.pendingScroll = null;
    if (Math.abs(nextScroll - el.scrollLeft) < 0.5) return;

    applyingFocusRef.current = true;
    el.scrollLeft = nextScroll;
    setScrollMetrics({
      scrollLeft: el.scrollLeft,
      clientWidth: el.clientWidth,
    });
    applyingFocusRef.current = false;
  }, [clipPreview, pixelsPerFrame]);

  useEffect(() => {
    if (!editable) return;

    /**
     * Live-preview track order from pointer travel against equal-height lanes.
     */
    function handlePointerMove(event: PointerEvent) {
      const drag = trackReorderRef.current;
      if (!drag) return;

      const deltaY = event.clientY - drag.originY;
      if (!drag.moved && Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }
      drag.moved = true;

      const toIndex = targetIndexFromDelta({
        fromIndex: drag.fromIndex,
        deltaY,
        itemHeight: drag.laneHeight,
        count: drag.originOrder.length,
      });
      const nextOrder = moveIndex({
        items: drag.originOrder,
        fromIndex: drag.fromIndex,
        toIndex,
      });
      drag.previewOrder = nextOrder;
      setTrackOrderPreview(nextOrder);
    }

    /**
     * Commit the previewed track order, or select the track on a click.
     */
    function finishPointer() {
      const drag = trackReorderRef.current;
      trackReorderRef.current = null;
      setTrackOrderPreview(null);

      if (!drag) return;

      if (!drag.moved) {
        onSelectTrackRef.current(drag.trackId);
        return;
      }

      if (sameTrackOrder(drag.originOrder, drag.previewOrder)) return;
      onReorderTracksRef.current?.({ trackIds: drag.previewOrder });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishPointer);
    window.addEventListener("pointercancel", finishPointer);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointer);
      window.removeEventListener("pointercancel", finishPointer);
    };
  }, [editable]);

  /**
   * Starts a clip move or trim interaction.
   */
  function beginClipDrag({
    event,
    clip,
    lane,
    mode,
  }: {
    event: ReactPointerEvent<HTMLElement>;
    clip: TimelineClip;
    lane: TimelineLane;
    mode: ClipDragMode;
  }) {
    if (!editable) return;
    if (trackReorderRef.current) return;
    if (
      isClipTooSmall({
        durationInFrames: clip.durationInFrames,
        pixelsPerFrame,
      })
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture can fail if this pointer is no longer active.
    }
    clipDragRef.current = {
      mode,
      sceneId: clip.sceneId,
      sourceTrackId: lane.trackId,
      originX: event.clientX,
      originStart: clip.startFrame,
      originDuration: clip.durationInFrames,
      moved: false,
      previewStart: clip.startFrame,
      previewDuration: clip.durationInFrames,
      targetTrackId: lane.trackId,
      lastClientX: event.clientX,
      pendingScroll: null,
      pointerId: event.pointerId,
    };
  }

  /**
   * Starts a vertical track reorder from the left-edge grip.
   */
  function beginTrackReorder({
    event,
    trackId,
  }: {
    event: ReactPointerEvent<HTMLElement>;
    trackId: string;
  }) {
    if (!canReorderTracks) return;
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.focus();

    const originOrder = lanesRef.current.map((lane) => lane.trackId);
    const fromIndex = originOrder.indexOf(trackId);
    if (fromIndex < 0) return;

    const laneEl = laneRefs.current.get(trackId);
    const laneHeight = laneEl?.getBoundingClientRect().height || 32;

    trackReorderRef.current = {
      trackId,
      fromIndex,
      originY: event.clientY,
      originOrder,
      previewOrder: originOrder,
      laneHeight,
      moved: false,
    };
    onSelectTrack(trackId);
  }

  /**
   * Keyboard alternative to dragging: move the focused track one slot.
   */
  function handleReorderKey({
    event,
    trackId,
  }: {
    event: ReactKeyboardEvent<HTMLButtonElement>;
    trackId: string;
  }) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const originOrder = lanes.map((lane) => lane.trackId);
    const fromIndex = originOrder.indexOf(trackId);
    const toIndex = event.key === "ArrowUp" ? fromIndex - 1 : fromIndex + 1;
    const nextOrder = moveIndex({
      items: originOrder,
      fromIndex,
      toIndex,
    });
    if (sameTrackOrder(originOrder, nextOrder)) return;
    onSelectTrack(trackId);
    onReorderTracks?.({ trackIds: nextOrder });
  }

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
        timelineContentWidth({
          durationInFrames,
          pixelsPerFrame: clamped,
          trackWidth: scrollEl.clientWidth,
        }) - scrollEl.clientWidth,
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

  // Cmd/Ctrl+wheel or pinch zooms; unmodified vertical wheel scrolls lanes; horizontal wheel pans.
  useEffect(() => {
    const panelEl = panelRef.current;
    if (!panelEl) return;

    /**
     * Routes wheel gestures: modifier/pinch zoom, vertical scroll for overflow, or native pan.
     */
    function handleWheel(event: WheelEvent) {
      const scrollEl = scrollRef.current;
      const panel = panelRef.current;
      if (!scrollEl || !panel) return;

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      const isPinch = event.ctrlKey || event.metaKey;
      const isVertical = absY >= absX && absY > 0;

      if (isPinch) {
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
        return;
      }

      if (isVertical) {
        const maxScroll = panel.scrollHeight - panel.clientHeight;
        if (maxScroll <= 0) return;

        event.preventDefault();

        let deltaY = event.deltaY;
        if (event.deltaMode === 1) deltaY *= 16;
        if (event.deltaMode === 2) deltaY *= panel.clientHeight;

        panel.scrollTop = Math.min(
          maxScroll,
          Math.max(0, panel.scrollTop + deltaY),
        );
      }
    }

    panelEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      panelEl.removeEventListener("wheel", handleWheel);
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
      timelineContentWidth({
        durationInFrames,
        pixelsPerFrame,
        trackWidth: el.clientWidth,
      }) - el.clientWidth,
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
  for (let f = 0; f <= stackDurationInFrames; f += majorStep) {
    ticks.push(f);
  }
  const tickDecimals = decimalsForTickFrames({ frames: ticks, fps });

  const playheadLeft = frame * pixelsPerFrame;
  const reorderingTrackId =
    trackOrderPreview && trackReorderRef.current?.moved
      ? trackReorderRef.current.trackId
      : null;

  /**
   * Render a clip with optional trim handle and drag preview.
   */
  function renderClip({
    clip,
    lane,
    laneIndex,
  }: {
    clip: TimelineClip;
    lane: TimelineLane;
    laneIndex: number;
  }) {
    const isPreview =
      clipPreview?.sceneId === clip.sceneId &&
      clipPreview.trackId === lane.trackId;
    const startFrame = isPreview ? clipPreview.startFrame : clip.startFrame;
    const duration = isPreview
      ? clipPreview.durationInFrames
      : clip.durationInFrames;
    const isDragging =
      clipDragRef.current?.sceneId === clip.sceneId && isPreview;
    const audioClips = sceneAudio[clip.sceneId] ?? [];
    const clipWidth = duration * pixelsPerFrame;
    const isTooSmall = isClipTooSmall({
      durationInFrames: duration,
      pixelsPerFrame,
    });

    return (
      <div
        key={clip.key}
        className={`sb-clip-wrap${selectedSceneId === clip.sceneId ? " is-current" : ""}${isDragging ? " is-dragging" : ""}${isTooSmall ? " is-too-small" : ""}${isAltLane({ laneIndex }) ? " is-alt" : ""}`}
        style={{
          left: startFrame * pixelsPerFrame,
          width: clipWidth,
        }}
      >
        <button
          type="button"
          className="sb-clip"
          style={{
            background: isTooSmall ? "var(--scene-locked)" : clipTone(laneIndex),
          }}
          title={
            isTooSmall
              ? `${clip.title} · zoom in to edit`
              : audioClips.length > 0
                ? `${clip.title} · ${duration}f · audio`
                : `${clip.title} · ${duration}f`
          }
          onPointerDown={(event) => {
            if (isTooSmall) return;
            if (!editable) {
              onSelectScene(clip.sceneId);
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            const nearEnd =
              event.clientX > rect.right - TRIM_HANDLE_PX && editable;
            beginClipDrag({
              event,
              clip,
              lane,
              mode: nearEnd ? "trim-end" : "move",
            });
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onIsolateScene(clip.sceneId);
          }}
        >
          {/* Waveform sits behind the title so the clip still reads as a scene */}
          {audioClips.length > 0 ? (
            <span className="sb-clip-wave" aria-hidden>
              <ClipWaveform
                clips={audioClips}
                width={clipWidth}
                durationInFrames={duration}
                fps={fps}
              />
            </span>
          ) : null}
          <span className="sb-clip-title">{clip.title}</span>
        </button>
        {editable && !isTooSmall ? (
          <div
            className="sb-clip-trim-handle"
            aria-hidden
            onPointerDown={(event) => {
              beginClipDrag({ event, clip, lane, mode: "trim-end" });
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`sb-dock${labelResizing ? " is-resizing-labels" : ""}`}>
      {/* Transport: play control, timecode, undo */}
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
          className="sb-icon-btn sb-play-btn"
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

        {/* Undo / redo on the right of the transport bar */}
        {editable ? (
          <div className="sb-transport-actions">
            <button
              type="button"
              className="sb-icon-btn"
              aria-label="Undo"
              title={`Undo (${undoHint})`}
              disabled={!canUndo}
              onClick={() => onUndo?.()}
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              className="sb-icon-btn"
              aria-label="Redo"
              title={`Redo (${redoHint})`}
              disabled={!canRedo}
              onClick={() => onRedo?.()}
            >
              <Redo2 size={16} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Ruler + lanes (scroll vertically when dock is short) */}
      <div className="sb-timeline-body">
        <div ref={panelRef} className="sb-timeline-panel">
          <div
            className={`sb-timeline${reorderingTrackId ? " is-reordering-tracks" : ""}${labelResizing ? " is-resizing-labels" : ""}`}
          >
            {/* Track titles sit left of the scrollport; grip only when reorderable */}
            <div className="sb-timeline-labels" style={{ width: labelWidth }}>
              <div
                className="sb-timeline-label-gutter"
                style={{ height: RULER_HEIGHT }}
              />
              {displayLanes.map((lane, laneIndex) => {
                const isCurrent = selectedTrackId === lane.trackId;
                const isDropTarget = dropTargetTrackId === lane.trackId;
                const isReordering = reorderingTrackId === lane.trackId;
                const isAlt = isAltLane({ laneIndex });
                const rowClass = `sb-timeline-label-row${canReorderTracks ? " has-reorder" : ""}${isCurrent ? " is-current" : ""}${isDropTarget ? " is-drop-target" : ""}${isReordering ? " is-reordering" : ""}${isAlt ? " is-alt" : ""}`;

                return (
                  <div key={lane.trackId} className={rowClass}>
                    {canReorderTracks ? (
                      <button
                        type="button"
                        className="sb-timeline-reorder-handle"
                        aria-label={`Reorder ${lane.title}`}
                        aria-grabbed={isReordering}
                        title="Drag to reorder"
                        onPointerDown={(event) => {
                          beginTrackReorder({ event, trackId: lane.trackId });
                        }}
                        onKeyDown={(event) => {
                          handleReorderKey({ event, trackId: lane.trackId });
                        }}
                      >
                        <GripVertical size={14} aria-hidden />
                      </button>
                    ) : null}
                    {isolated ? (
                      <div
                        className="sb-timeline-label"
                        title={lane.description}
                      >
                        {lane.title}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="sb-timeline-label"
                        title={lane.description}
                        onClick={() => onSelectTrack(lane.trackId)}
                      >
                        {lane.title}
                      </button>
                    )}
                  </div>
                );
              })}
              {/* Drag the column edge to show more or less of the track names */}
              <button
                type="button"
                className="sb-timeline-label-resize-handle"
                aria-orientation="vertical"
                aria-label="Resize track names"
                aria-valuemin={labelColumnMinWidth({ canReorderTracks })}
                aria-valuemax={LABEL_COLUMN_MAX_WIDTH}
                aria-valuenow={labelWidth}
                title="Drag to resize track names"
                onPointerDown={(event) => {
                  beginLabelColumnResize({ event });
                }}
                onPointerMove={(event) => {
                  handleLabelResizeMove({ event });
                }}
                onPointerUp={(event) => {
                  finishLabelColumnResize({ event });
                }}
                onPointerCancel={(event) => {
                  finishLabelColumnResize({ event });
                }}
                onKeyDown={(event) => {
                  handleLabelResizeKey({ event });
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  resetLabelColumnWidth();
                }}
              />
            </div>

            {/* Scrollport: native scrollbar hidden; trailing gutter keeps the last trim handle grabbable */}
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
                  {ticks.map((tick, index) => (
                    <div
                      key={tick}
                      className={`sb-ruler-tick${rulerTickEdgeClass({
                        index,
                        count: ticks.length,
                      })}`}
                      style={{ left: tick * pixelsPerFrame }}
                    >
                      <span>
                        {formatFlooredTimecode({
                          frame: tick,
                          fps,
                          decimals: tickDecimals,
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                {displayLanes.map((lane, laneIndex) => (
                  <div
                    key={lane.trackId}
                    ref={(node) => {
                      if (node) laneRefs.current.set(lane.trackId, node);
                      else laneRefs.current.delete(lane.trackId);
                    }}
                    className={`sb-lane${dropTargetTrackId === lane.trackId ? " is-drop-target" : ""}${reorderingTrackId === lane.trackId ? " is-reordering" : ""}${isAltLane({ laneIndex }) ? " is-alt" : ""}`}
                    data-track-id={lane.trackId}
                  >
                    {lane.clips.map((clip) =>
                      renderClip({ clip, lane, laneIndex }),
                    )}
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

          {/* Add-track row: full width below lanes, expands on hover */}
          {editable ? (
            <div className="sb-timeline-add-bar">
              <button
                type="button"
                className="sb-timeline-add-label"
                style={{ width: labelWidth }}
                aria-label="Add track"
                onClick={() => onAddTrack?.()}
              >
                <Plus size={14} aria-hidden />
                Add
              </button>
              <button
                type="button"
                className="sb-timeline-add-lane"
                aria-label="Add track"
                onClick={() => onAddTrack?.()}
              >
                <Plus size={14} aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        {/* Focus bar: full-width pan/zoom overview pinned to the dock bottom */}
        <div className="sb-timeline-focus">
          <TimelineFocusBar
            durationInFrames={scrollableDuration}
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
 * Whether this lane uses the high-contrast magenta-soft alt colour.
 */
function isAltLane({ laneIndex }: { laneIndex: number }): boolean {
  return laneIndex % 2 === 1;
}

/**
 * Alternating clip fills: dark plum-magenta, then magenta-soft.
 */
function clipTone(laneIndex: number): string {
  return isAltLane({ laneIndex }) ? "var(--scene-b)" : "var(--scene-a)";
}

/**
 * Whether two track-id lists are in the same order.
 */
function sameTrackOrder(left: string[], right: string[]): boolean {
  return (
    left.length === right.length && left.every((id, index) => id === right[index])
  );
}

/**
 * Edge class so first/last ruler labels sit against the timeline bounds.
 * Middle ticks stay centred on their time point.
 */
function rulerTickEdgeClass({
  index,
  count,
}: {
  index: number;
  count: number;
}): string {
  if (index === 0) return " is-start";
  if (index === count - 1) return " is-end";
  return "";
}

/**
 * Whether a clip is too narrow at the current zoom to move, trim, or select.
 */
function isClipTooSmall({
  durationInFrames,
  pixelsPerFrame,
}: {
  durationInFrames: number;
  pixelsPerFrame: number;
}): boolean {
  return durationInFrames * pixelsPerFrame < MIN_CLIP_INTERACT_PX;
}
