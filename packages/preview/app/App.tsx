import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  Sequence,
  StoryboardProvider,
  type VideoConfig,
} from "@levi-putna/storyboard-core";
import {
  listScenes,
  totalDurationInFrames,
  type Format,
  type Scene,
} from "@levi-putna/storyboard-schema";
import { CompositionFromManifest } from "@levi-putna/storyboard-transitions";
import { components, manifest } from "./.generated/project";
import { Explorer, type ExplorerGroup } from "./Explorer";
import { FormatSwitcher } from "./FormatSwitcher";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { PropFields } from "./PropFields";
import { Timeline } from "./Timeline";
import {
  clampDockHeight,
  DOCK_DEFAULT_HEIGHT,
  DOCK_HEIGHT_STORAGE_KEY,
  DOCK_MAX_HEIGHT,
  DOCK_MIN_HEIGHT,
  readStoredDockHeight,
} from "./dockLayout";
import {
  clipBySceneId,
  timelineLanes,
  type TimelineLane,
} from "./timelineModel";

const isEmbed =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("embed");

const SCENE_TONES = ["var(--scene-a)", "var(--scene-b)", "var(--lead)"];

/**
 * Preview studio: composition stage, scenes sidebar, and multi-lane timeline.
 * With `?embed=1`, hides chrome and accepts host frame control (First Take).
 */
export function App() {
  const [formatId, setFormatId] = useState(manifest.formats[0].id);
  const format =
    manifest.formats.find((entry) => entry.id === formatId) ?? manifest.formats[0];
  const compositionDuration = totalDurationInFrames(manifest);
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

  const fullLanes = useMemo(() => timelineLanes({ manifest }), []);
  const firstSceneId = listScenes(manifest)[0]?.id ?? "";
  const [selectedSceneId, setSelectedSceneId] = useState(firstSceneId);
  const [isolatedSceneId, setIsolatedSceneId] = useState<string | null>(null);
  const [propOverrides, setPropOverrides] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const isolatedScene = isolatedSceneId
    ? listScenes(manifest).find((scene) => scene.id === isolatedSceneId)
    : undefined;
  const isolatedClip = isolatedSceneId
    ? clipBySceneId({ lanes: fullLanes, sceneId: isolatedSceneId })
    : undefined;

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
    [format, duration],
  );

  /**
   * Select a scene in the sidebar and timeline. Seeks if the playhead is outside the clip.
   */
  function selectScene({ sceneId }: { sceneId: string }) {
    setSelectedSceneId(sceneId);
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
   * Isolate a scene on a local clock (double-click).
   */
  function isolateScene({ sceneId }: { sceneId: string }) {
    const scene = listScenes(manifest).find((entry) => entry.id === sceneId);
    if (!scene) return;
    setSelectedSceneId(sceneId);
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

  const explorerGroups: ExplorerGroup[] = useMemo(() => {
    return fullLanes.map((lane, laneIndex) => ({
      trackId: lane.trackId,
      title: lane.title,
      items: lane.clips.map((clip) => ({
        id: clip.sceneId,
        title: clip.title,
        detail: `${clip.durationInFrames}f`,
        tone: SCENE_TONES[laneIndex % SCENE_TONES.length],
      })),
    }));
  }, [fullLanes]);

  // Restore and clamp dock height when the shell resizes.
  useEffect(() => {
    if (isEmbed) return;

    const syncDockHeight = () => {
      const shellHeight = shellRef.current?.clientHeight ?? window.innerHeight;
      setDockHeight((current) => {
        const stored = readStoredDockHeight({ shellHeight });
        const next = clampDockHeight({
          height: stored ?? current,
          shellHeight,
        });
        return next;
      });
    };

    syncDockHeight();
    window.addEventListener("resize", syncDockHeight);
    return () => window.removeEventListener("resize", syncDockHeight);
  }, []);

  /**
   * Drag the handle above the timeline to resize the dock.
   */
  function beginDockResize({ clientY }: { clientY: number }) {
    dockResizeStart.current = { y: clientY, height: dockHeight };
    setDockResizing(true);
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

  const selectedScene: Scene | undefined = listScenes(manifest).find(
    (scene) => scene.id === selectedSceneId,
  );
  const selectedProps =
    propOverrides[selectedSceneId] ?? selectedScene?.props ?? {};

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
              <Isolated
                {...(propOverrides[isolatedScene.id] ??
                  isolatedScene.props ??
                  {})}
              />
            </Sequence>
          ) : (
            <CompositionFromManifest
              manifest={manifest}
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
      className={`sb-shell${dockResizing ? " is-dock-resizing" : ""}`}
    >
      {/* Top bar: title / video switcher + format pill */}
      <header className="sb-header">
        <div className="sb-title">
          <strong>Storyboard</strong>
          <ProjectSwitcher title={manifest.title} />
        </div>
        <FormatSwitcher
          formats={manifest.formats}
          formatId={format.id}
          onFormatChange={setFormatId}
          onFormatAdd={addFormat}
        />
      </header>

      <div className="sb-body">
        {/* Left: scenes grouped by track + props inspector */}
        <Explorer
          groups={explorerGroups}
          selectedId={selectedSceneId}
          onSelect={(id) => selectScene({ sceneId: id })}
        >
          <div className="sb-props">
            <h2>Props</h2>
            <PropFields
              key={selectedSceneId}
              values={selectedProps}
              onChange={(next) => {
                setPropOverrides((current) => ({
                  ...current,
                  [selectedSceneId]: next,
                }));
              }}
            />
          </div>
        </Explorer>

        {stage}
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
          fps={manifest.fps}
          playing={playing}
          muted={muted}
          onPlayingChange={setPlaying}
          onMutedChange={setMuted}
          onFrameChange={setFrame}
          lanes={lanes}
          selectedSceneId={selectedSceneId}
          onSelectScene={(sceneId) => selectScene({ sceneId })}
          onIsolateScene={(sceneId) => isolateScene({ sceneId })}
          isolated={Boolean(isolatedSceneId)}
          onBack={backToTimeline}
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
