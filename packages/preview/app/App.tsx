import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import {
  SceneProvider,
  Sequence,
  StoryboardProvider,
  type VideoConfig,
} from "@levi-putna/storyboard-core";
import {
  listScenes,
  totalDurationInFrames,
  type Format,
  type Scene,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";
import { CompositionFromManifest } from "@levi-putna/storyboard-transitions";
import { components, manifest } from "./.generated/project";
import { DetailsSidebar } from "./DetailsSidebar";
import { FormatSwitcher } from "./FormatSwitcher";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { Timeline } from "./Timeline";
import { useSceneAudio } from "./useSceneAudio";
import {
  clampDockHeight,
  clampSidebarWidth,
  DOCK_DEFAULT_HEIGHT,
  DOCK_HEIGHT_STORAGE_KEY,
  DOCK_MAX_HEIGHT,
  DOCK_MIN_HEIGHT,
  readStoredDockHeight,
  readStoredSidebarWidth,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from "./dockLayout";
import {
  addTrack,
  moveScene,
  reorderTracks,
  timelineStructureEqual,
  trimSceneEnd,
  updateScene,
  updateTrack,
} from "./timelineEdit";
import {
  clipBySceneId,
  timelineLanes,
  type TimelineLane,
} from "./timelineModel";

const isEmbed =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("embed");

/**
 * Preview studio: composition stage, details sidebar, and multi-lane timeline.
 * With `?embed=1`, hides chrome and accepts host frame control (First Take).
 */
export function App() {
  const [formatId, setFormatId] = useState(manifest.formats[0].id);
  const format =
    manifest.formats.find((entry) => entry.id === formatId) ?? manifest.formats[0];
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const lastTs = useRef<number | null>(null);
  const accum = useRef(0);
  const hostDriven = useRef(isEmbed);
  const shellRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const [well, setWell] = useState({ w: 900, h: 500 });
  const [dockHeight, setDockHeight] = useState(DOCK_DEFAULT_HEIGHT);
  const [dockResizing, setDockResizing] = useState(false);
  const dockResizeStart = useRef({ y: 0, height: DOCK_DEFAULT_HEIGHT });
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [sidebarResizing, setSidebarResizing] = useState(false);
  const sidebarResizeStart = useRef({ x: 0, width: SIDEBAR_DEFAULT_WIDTH });
  const [workingManifest, setWorkingManifest] = useState<VideoManifest>(manifest);
  const [dropTargetTrackId, setDropTargetTrackId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setWorkingManifest(manifest);
    setPropOverrides({});
    setSaveError(null);
    setDropTargetTrackId(null);
    setIsolatedSceneId(null);
    setSelectedSceneId(null);
    setSelectedTrackId(null);
    setFrame(0);
  }, [manifest]);

  const compositionDuration = totalDurationInFrames(workingManifest);
  const fullLanes = useMemo(
    () => timelineLanes({ manifest: workingManifest }),
    [workingManifest],
  );
  const timelineDirty = useMemo(
    () => !timelineStructureEqual({ left: manifest, right: workingManifest }),
    [manifest, workingManifest],
  );
  const manifestMetadataDirty = useMemo(
    () => manifest.title !== workingManifest.title,
    [manifest.title, workingManifest.title],
  );
  const workingManifestDirty = timelineDirty || manifestMetadataDirty;
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isolatedSceneId, setIsolatedSceneId] = useState<string | null>(null);
  const [propOverrides, setPropOverrides] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [pendingSave, setPendingSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const propOverridesRef = useRef(propOverrides);
  propOverridesRef.current = propOverrides;

  const isolatedScene = isolatedSceneId
    ? listScenes(workingManifest).find((scene) => scene.id === isolatedSceneId)
    : undefined;
  const isolatedClip = isolatedSceneId
    ? clipBySceneId({ lanes: fullLanes, sceneId: isolatedSceneId })
    : undefined;

  const sceneAudio = useSceneAudio({
    manifest: workingManifest,
    lanes: fullLanes,
    isolated: Boolean(isolatedSceneId),
  });

  const duration = isolatedScene
    ? isolatedScene.durationInFrames
    : compositionDuration;

  const lanes: TimelineLane[] = isolatedScene
    ? [
        {
          trackId: "focus",
          title: isolatedScene.title,
          clips: [
            {
              key: isolatedScene.id,
              sceneId: isolatedScene.id,
              title: isolatedScene.title,
              startFrame: 0,
              durationInFrames: isolatedScene.durationInFrames,
            },
          ],
        },
      ]
    : fullLanes;

  const config: VideoConfig = useMemo(
    () => ({
      id: `${manifest.slug}-${format.id}`,
      fps: manifest.fps,
      width: format.width,
      height: format.height,
      durationInFrames: duration,
    }),
    [format, duration, workingManifest.fps, workingManifest.slug],
  );

  /**
   * Clear scene and track selection to show video details.
   */
  function clearSelection() {
    setSelectedSceneId(null);
    setSelectedTrackId(null);
  }

  /**
   * Select a scene from the timeline. Seeks if the playhead is outside the clip.
   */
  function selectScene({ sceneId }: { sceneId: string }) {
    setSelectedSceneId(sceneId);
    setSelectedTrackId(null);
    setPlaying(false);
    if (isolatedSceneId) {
      setIsolatedSceneId(sceneId);
      setFrame(0);
      return;
    }
    const clip = clipBySceneId({ lanes: fullLanes, sceneId });
    if (!clip) return;
    if (
      frame < clip.startFrame ||
      frame >= clip.startFrame + clip.durationInFrames
    ) {
      setFrame(clip.startFrame);
    }
  }

  /**
   * Select a track from the timeline lane label.
   */
  function selectTrack({ trackId }: { trackId: string }) {
    setSelectedTrackId(trackId);
    setSelectedSceneId(null);
    setPlaying(false);
  }

  /**
   * Isolate a scene on a local clock (double-click).
   */
  function isolateScene({ sceneId }: { sceneId: string }) {
    const scene = listScenes(workingManifest).find((entry) => entry.id === sceneId);
    if (!scene) return;
    setSelectedSceneId(sceneId);
    setSelectedTrackId(null);
    setIsolatedSceneId(sceneId);
    setPlaying(false);
    setFrame(0);
  }

  /**
   * Leave isolate mode and restore the composition playhead.
   */
  function backToTimeline() {
    const clip = isolatedClip;
    setIsolatedSceneId(null);
    setPlaying(false);
    setFrame(clip?.startFrame ?? 0);
  }

  /**
   * Apply a timeline move from the clip editor.
   */
  function applyMoveScene({
    sceneId,
    targetTrackId,
    startFrame,
  }: {
    sceneId: string;
    targetTrackId: string;
    startFrame: number;
  }) {
    try {
      setWorkingManifest((current) =>
        moveScene({
          manifest: current,
          sceneId,
          targetTrackId,
          startFrame,
          playheadFrame: frame,
        }),
      );
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Apply a clip end-trim from the timeline editor.
   */
  function applyTrimScene({
    sceneId,
    durationInFrames,
  }: {
    sceneId: string;
    durationInFrames: number;
  }) {
    try {
      setWorkingManifest((current) =>
        trimSceneEnd({ manifest: current, sceneId, durationInFrames }),
      );
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Blur the focused field so it commits, then persist overrides to video.json.
   */
  function requestSave() {
    if (saving || pendingSave) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setPendingSave(true);
  }

  // Host bridge for First Take (and other embedders).
  useEffect(() => {
    if (!isEmbed) return;

    const api = {
      setFrame: (next: number) => {
        hostDriven.current = true;
        setFrame(Math.max(0, Math.min(duration - 1, Math.floor(next))));
      },
      setSeconds: (seconds: number) => {
        hostDriven.current = true;
        const next = Math.round(seconds * manifest.fps);
        setFrame(Math.max(0, Math.min(duration - 1, next)));
      },
      setPlaying: (next: boolean) => {
        hostDriven.current = true;
        setPlaying(next);
      },
    };

    (
      window as unknown as { __FIRST_TAKE_PREVIEW__?: typeof api }
    ).__FIRST_TAKE_PREVIEW__ = api;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        source?: string;
        type?: string;
        frame?: number;
        seconds?: number;
        playing?: boolean;
      } | null;
      if (!data || data.source !== "first-take") return;
      if (data.type === "setFrame" && typeof data.frame === "number") {
        api.setFrame(data.frame);
      } else if (data.type === "setSeconds" && typeof data.seconds === "number") {
        api.setSeconds(data.seconds);
      } else if (data.type === "setPlaying" && typeof data.playing === "boolean") {
        api.setPlaying(data.playing);
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      delete (window as unknown as { __FIRST_TAKE_PREVIEW__?: typeof api })
        .__FIRST_TAKE_PREVIEW__;
    };
  }, [duration]);

  // Play advances integer frames at fps.
  useEffect(() => {
    if (isEmbed) return;
    if (!playing) {
      lastTs.current = null;
      return;
    }
    let raf = 0;
    const tick = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts;
      const delta = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      accum.current += delta * config.fps;
      if (accum.current >= 1) {
        const steps = Math.floor(accum.current);
        accum.current -= steps;
        setFrame((current) => {
          const next = current + steps;
          if (next >= duration) {
            setPlaying(false);
            return Math.max(0, duration - 1);
          }
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, config.fps, duration]);

  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 900,
    h: typeof window !== "undefined" ? window.innerHeight : 500,
  }));

  useEffect(() => {
    if (!isEmbed) return;
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isEmbed) return;
    const el = wellRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setWell({ w: rect.width, h: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isEmbed]);

  const pad = 48;
  const scale = isEmbed
    ? Math.min(viewport.w / format.width, viewport.h / format.height)
    : Math.min(1, (well.w - pad) / format.width, (well.h - pad) / format.height);

  // Space toggles playback unless a field is focused.
  useEffect(() => {
    if (isEmbed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      setPlaying((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cmd/Ctrl+S writes live prop overrides back to the open video.json.
  useEffect(() => {
    if (isEmbed) return;
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
        return;
      }
      event.preventDefault();
      requestSave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, pendingSave]);

  // Escape clears timeline selection back to video details.
  useEffect(() => {
    if (isEmbed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!selectedSceneId && !selectedTrackId) return;
      event.preventDefault();
      clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEmbed, selectedSceneId, selectedTrackId]);

  // Persist after the render that includes any in-progress field commit.
  useEffect(() => {
    if (!pendingSave || isEmbed) return;

    const overrides = propOverridesRef.current;
    const hasPropChanges = Object.keys(overrides).length > 0;
    const hasTimelineChanges = workingManifestDirty;
    if (!hasPropChanges && !hasTimelineChanges) {
      setPendingSave(false);
      return;
    }

    let cancelled = false;
    setSaving(true);
    setSaveError(null);

    void (async () => {
      try {
        const response = await fetch("/__storyboard/save-props", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overrides,
            timeline: hasTimelineChanges ? workingManifest : undefined,
          }),
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          errors?: string[];
        };
        if (!response.ok || !payload.ok) {
          throw new Error(payload.errors?.join("; ") || "Could not save changes");
        }
        if (!cancelled) setPropOverrides({});
      } catch (err) {
        if (!cancelled) {
          setSaveError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setSaving(false);
          setPendingSave(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingSave, workingManifestDirty, workingManifest]);

  const savedLanes = useMemo(
    () => timelineLanes({ manifest }),
    [manifest],
  );

  const selectedTrackDirty = useMemo(() => {
    if (!selectedTrackId) return false;
    const lane = fullLanes.find((entry) => entry.trackId === selectedTrackId);
    const savedLane = savedLanes.find((entry) => entry.trackId === selectedTrackId);
    if (!lane || !savedLane) return false;
    return (
      savedLane.title !== lane.title ||
      (savedLane.description ?? "") !== (lane.description ?? "")
    );
  }, [fullLanes, savedLanes, selectedTrackId]);

  // Restore and clamp dock + sidebar sizes when the shell resizes.
  useEffect(() => {
    if (isEmbed) return;

    const syncLayoutSizes = () => {
      const shellHeight = shellRef.current?.clientHeight ?? window.innerHeight;
      const shellWidth = shellRef.current?.clientWidth ?? window.innerWidth;

      setDockHeight((current) => {
        const stored = readStoredDockHeight({ shellHeight });
        return clampDockHeight({
          height: stored ?? current,
          shellHeight,
        });
      });

      setSidebarWidth((current) => {
        const stored = readStoredSidebarWidth({ shellWidth });
        return clampSidebarWidth({
          width: stored ?? current,
          shellWidth,
        });
      });
    };

    syncLayoutSizes();
    window.addEventListener("resize", syncLayoutSizes);
    return () => window.removeEventListener("resize", syncLayoutSizes);
  }, []);

  /**
   * Drag the handle above the timeline to resize the dock.
   */
  function beginDockResize({ clientY }: { clientY: number }) {
    dockResizeStart.current = { y: clientY, height: dockHeight };
    setDockResizing(true);
  }

  /**
   * Drag the handle beside the sidebar to resize it.
   */
  function beginSidebarResize({ clientX }: { clientX: number }) {
    sidebarResizeStart.current = { x: clientX, width: sidebarWidth };
    setSidebarResizing(true);
  }

  useEffect(() => {
    if (isEmbed || !dockResizing) return;

    const onMove = (event: MouseEvent) => {
      const shellHeight = shellRef.current?.clientHeight ?? window.innerHeight;
      const delta = dockResizeStart.current.y - event.clientY;
      setDockHeight(
        clampDockHeight({
          height: dockResizeStart.current.height + delta,
          shellHeight,
        }),
      );
    };

    const onUp = () => {
      setDockResizing(false);
      setDockHeight((current) => {
        window.localStorage.setItem(DOCK_HEIGHT_STORAGE_KEY, String(current));
        return current;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dockResizing]);

  useEffect(() => {
    if (isEmbed || !sidebarResizing) return;

    const onMove = (event: MouseEvent) => {
      const shellWidth = shellRef.current?.clientWidth ?? window.innerWidth;
      const delta = sidebarResizeStart.current.x - event.clientX;
      setSidebarWidth(
        clampSidebarWidth({
          width: sidebarResizeStart.current.width + delta,
          shellWidth,
        }),
      );
    };

    const onUp = () => {
      setSidebarResizing(false);
      setSidebarWidth((current) => {
        window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(current));
        return current;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [sidebarResizing]);

  const selectedScene: Scene | undefined =
    selectedSceneId != null
      ? listScenes(workingManifest).find((scene) => scene.id === selectedSceneId)
      : undefined;
  const selectedProps =
    selectedSceneId != null
      ? propOverrides[selectedSceneId] ?? selectedScene?.props ?? {}
      : {};
  const propDirtyCount = Object.keys(propOverrides).length;
  const unsavedCount = propDirtyCount + (workingManifestDirty ? 1 : 0);
  const saveHint =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
      ? "⌘S"
      : "Ctrl+S";

  const Isolated = isolatedScene
    ? (components[isolatedScene.component] as
        | ComponentType<Record<string, unknown>>
        | undefined)
    : undefined;

  const stage = (
    <main
      ref={isEmbed ? undefined : wellRef}
      className={isEmbed ? undefined : "sb-stage-well"}
      style={
        isEmbed
          ? {
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }
          : undefined
      }
    >
      <CompositionFrame
        width={format.width}
        height={format.height}
        scale={scale}
        embed={isEmbed}
      >
        <StoryboardProvider
          frame={frame}
          config={config}
          playing={playing}
          muted={isEmbed ? true : muted}
        >
          {isolatedScene && Isolated ? (
            <Sequence from={0} durationInFrames={isolatedScene.durationInFrames}>
              <SceneProvider sceneId={isolatedScene.id}>
                <Isolated
                  {...(propOverrides[isolatedScene.id] ??
                    isolatedScene.props ??
                    {})}
                />
              </SceneProvider>
            </Sequence>
          ) : (
            <CompositionFromManifest
              manifest={workingManifest}
              components={components}
              scenePropOverrides={propOverrides}
            />
          )}
        </StoryboardProvider>
      </CompositionFrame>
    </main>
  );

  if (isEmbed) {
    return (
      <div style={{ display: "flex", height: "100%", width: "100%" }}>
        {stage}
      </div>
    );
  }

  const addFormat = async (next: Format) => {
    const response = await fetch("/__storyboard/add-format", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      errors?: string[];
    };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.errors?.join("; ") || "Could not add format");
    }
  };

  return (
    <div
      ref={shellRef}
      className={`sb-shell${dockResizing ? " is-dock-resizing" : ""}${sidebarResizing ? " is-sidebar-resizing" : ""}`}
      style={
        {
          "--sb-sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      {/* Top bar: title / video switcher + format pill */}
      <header className="sb-header">
        <div className="sb-title">
          <strong>Storyboard</strong>
          <ProjectSwitcher title={workingManifest.title} />
        </div>
        <FormatSwitcher
          formats={manifest.formats}
          formatId={format.id}
          onFormatChange={setFormatId}
          onFormatAdd={addFormat}
        />
      </header>

      {/* Composition preview */}
      {stage}

      {/* Right: selection-driven details panel */}
      <div className="sb-sidebar-host">
        <DetailsSidebar
          manifest={workingManifest}
          compositionDuration={compositionDuration}
          fullLanes={fullLanes}
          selectedSceneId={selectedSceneId}
          selectedTrackId={selectedTrackId}
          selectedScene={selectedScene}
          selectedProps={selectedProps}
          trackDirty={selectedTrackDirty}
          unsavedCount={unsavedCount}
          saving={saving}
          saveError={saveError}
          saveHint={saveHint}
          onClearSelection={clearSelection}
          onRequestSave={requestSave}
          onPropChange={(next) => {
            if (!selectedSceneId) return;
            setPropOverrides((current) => ({
              ...current,
              [selectedSceneId]: next,
            }));
          }}
          onVideoTitleChange={({ title }) => {
            setWorkingManifest((current) => ({ ...current, title }));
          }}
          onSceneTitleChange={({ sceneId, title }) => {
            setWorkingManifest((current) =>
              updateScene({ manifest: current, sceneId, title }),
            );
          }}
          onTrackTitleChange={({ trackId, title }) => {
            setWorkingManifest((current) =>
              updateTrack({ manifest: current, trackId, title }),
            );
          }}
          onTrackDescriptionChange={({ trackId, description }) => {
            setWorkingManifest((current) =>
              updateTrack({
                manifest: current,
                trackId,
                description: description || null,
              }),
            );
          }}
          onTrackMoveUp={(trackId) => {
            const ids = workingManifest.tracks.map((track) => track.id);
            const index = ids.indexOf(trackId);
            if (index <= 0) return;
            const next = [...ids];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            setWorkingManifest((current) =>
              reorderTracks({ manifest: current, trackIds: next }),
            );
          }}
          onTrackMoveDown={(trackId) => {
            const ids = workingManifest.tracks.map((track) => track.id);
            const index = ids.indexOf(trackId);
            if (index < 0 || index >= ids.length - 1) return;
            const next = [...ids];
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
            setWorkingManifest((current) =>
              reorderTracks({ manifest: current, trackIds: next }),
            );
          }}
        />

        {/* Sidebar resize handle */}
        <div
          className="sb-sidebar-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={sidebarWidth}
          onMouseDown={(event) => {
            event.preventDefault();
            beginSidebarResize({ clientX: event.clientX });
          }}
          onDoubleClick={() => {
            const shellWidth =
              shellRef.current?.clientWidth ?? window.innerWidth;
            const next = clampSidebarWidth({
              width: SIDEBAR_DEFAULT_WIDTH,
              shellWidth,
            });
            setSidebarWidth(next);
            window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(next));
          }}
        />
      </div>

      {/* Resize handle */}
      <div
        className="sb-dock-resize-handle"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize timeline"
        aria-valuemin={DOCK_MIN_HEIGHT}
        aria-valuemax={DOCK_MAX_HEIGHT}
        aria-valuenow={dockHeight}
        onMouseDown={(event) => {
          event.preventDefault();
          beginDockResize({ clientY: event.clientY });
        }}
        onDoubleClick={() => {
          const shellHeight = shellRef.current?.clientHeight ?? window.innerHeight;
          const next = clampDockHeight({
            height: DOCK_DEFAULT_HEIGHT,
            shellHeight,
          });
          setDockHeight(next);
          window.localStorage.setItem(DOCK_HEIGHT_STORAGE_KEY, String(next));
        }}
      />

      {/* Bottom: transport + multi-lane timeline */}
      <div className="sb-dock-host" style={{ height: dockHeight }}>
        <Timeline
          frame={frame}
          durationInFrames={duration}
          fps={workingManifest.fps}
          playing={playing}
          muted={muted}
          onPlayingChange={setPlaying}
          onMutedChange={setMuted}
          onFrameChange={setFrame}
          lanes={lanes}
          selectedSceneId={selectedSceneId}
          selectedTrackId={selectedTrackId}
          onSelectScene={(sceneId) => selectScene({ sceneId })}
          onSelectTrack={(trackId) => selectTrack({ trackId })}
          onIsolateScene={(sceneId) => isolateScene({ sceneId })}
          isolated={Boolean(isolatedSceneId)}
          onBack={backToTimeline}
          editable={!isolatedSceneId}
          onMoveScene={applyMoveScene}
          onTrimScene={applyTrimScene}
          dropTargetTrackId={dropTargetTrackId}
          onDropTargetTrackChange={setDropTargetTrackId}
          onAddTrack={() => {
            setWorkingManifest((current) => addTrack({ manifest: current }));
          }}
          onReorderTracks={({ trackIds }) => {
            setWorkingManifest((current) =>
              reorderTracks({ manifest: current, trackIds }),
            );
          }}
          sceneAudio={sceneAudio}
        />
      </div>
    </div>
  );
}

/**
 * Scaled composition viewport.
 */
function CompositionFrame({
  width,
  height,
  scale,
  embed,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  embed: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={embed ? undefined : "sb-frame"}
      style={{
        width: width * scale,
        height: height * scale,
      }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          background: "#000",
        }}
      >
        {children}
      </div>
    </div>
  );
}
