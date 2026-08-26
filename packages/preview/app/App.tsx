import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  StoryboardProvider,
  type VideoConfig,
} from "@levi-putna/storyboard-core";
import { totalDurationInFrames } from "@levi-putna/storyboard-schema";
import { CompositionFromManifest } from "@levi-putna/storyboard-transitions";
import { components, manifest } from "./.generated/project";
import { playground } from "./.generated/playground-entry";
import { Explorer, type ExplorerItem } from "./Explorer";
import { FormatSwitcher } from "./FormatSwitcher";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { PropFields } from "./PropFields";
import { Timeline } from "./Timeline";
import { timelineSegments, segmentAtFrame } from "./timelineModel";
import type { Format } from "@levi-putna/storyboard-schema";

type Mode = "video" | "playground";

const isEmbed =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("embed");

const SCENE_TONES = ["var(--scene-a)", "var(--scene-b)", "var(--lead)"];

/**
 * Preview studio: video editor chrome + component playground.
 * With `?embed=1`, hides chrome and accepts host frame control (First Take).
 */
export function App() {
  const [mode, setMode] = useState<Mode>("video");
  const [formatId, setFormatId] = useState(manifest.formats[0].id);
  const format =
    manifest.formats.find((entry) => entry.id === formatId) ?? manifest.formats[0];
  const duration = totalDurationInFrames(manifest);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lastTs = useRef<number | null>(null);
  const accum = useRef(0);
  const hostDriven = useRef(isEmbed);
  const wellRef = useRef<HTMLDivElement>(null);
  const [well, setWell] = useState({ w: 900, h: 500 });

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

  const segments = useMemo(() => timelineSegments({ manifest }), [manifest]);

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
  // In embed mode the host (First Take) owns the clock via setSeconds.
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
            return duration - 1;
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

  // Playground state
  const [pgId, setPgId] = useState(playground[0]?.id ?? "");
  const entry = playground.find((item) => item.id === pgId);
  const [appliedProps, setAppliedProps] = useState<Record<string, unknown>>(
    entry?.defaultProps ?? {},
  );
  const [pgFrame, setPgFrame] = useState(0);
  const [pgPlaying, setPgPlaying] = useState(false);
  const pgDuration = entry?.durationInFrames ?? 90;

  useEffect(() => {
    if (!entry) return;
    setAppliedProps(entry.defaultProps);
    setPgFrame(0);
    setPgPlaying(false);
  }, [pgId, entry]);

  useEffect(() => {
    if (!pgPlaying || !entry) return;
    let raf = 0;
    let last: number | null = null;
    let acc = 0;
    const tick = (ts: number) => {
      if (last == null) last = ts;
      const delta = (ts - last) / 1000;
      last = ts;
      acc += delta * manifest.fps;
      if (acc >= 1) {
        const steps = Math.floor(acc);
        acc -= steps;
        setPgFrame((current) => {
          const next = current + steps;
          if (next >= pgDuration) {
            setPgPlaying(false);
            return pgDuration - 1;
          }
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pgPlaying, entry, pgDuration]);

  // Space toggles playback unless a field is focused.
  useEffect(() => {
    if (isEmbed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      if (mode === "video") setPlaying((value) => !value);
      else setPgPlaying((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const videoItems: ExplorerItem[] = useMemo(() => {
    const items: ExplorerItem[] = [];
    if (manifest.leadIn) {
      items.push({
        id: "lead-in",
        title: "Lead-in",
        detail: "Brand hold",
        tone: "var(--lead)",
      });
    }
    manifest.scenes.forEach((scene, index) => {
      const audio =
        scene.audioStartSeconds != null && scene.audioEndSeconds != null
          ? `VO ${scene.audioStartSeconds}s–${scene.audioEndSeconds}s`
          : `${scene.durationInFrames}f`;
      items.push({
        id: scene.id,
        title: scene.title,
        detail: audio,
        tone: SCENE_TONES[index % SCENE_TONES.length],
      });
    });
    return items;
  }, []);

  const playgroundItems: ExplorerItem[] = playground.map((item, index) => ({
    id: item.id,
    title: item.id,
    detail: `${item.durationInFrames}f`,
    tone: SCENE_TONES[index % SCENE_TONES.length],
  }));

  const selectedVideoId =
    segmentAtFrame({ segments, frame })?.key ?? segments[0]?.key ?? "";

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
      {mode === "video" ? (
        <CompositionFrame
          width={format.width}
          height={format.height}
          scale={scale}
          embed={isEmbed}
        >
          <StoryboardProvider frame={frame} config={config}>
            <CompositionFromManifest
              manifest={manifest}
              components={components}
            />
          </StoryboardProvider>
        </CompositionFrame>
      ) : entry ? (
        <PlaygroundStage
          Component={entry.component}
          props={appliedProps}
          frame={pgFrame}
          durationInFrames={pgDuration}
          fps={manifest.fps}
          width={format.width}
          height={format.height}
          scale={scale}
        />
      ) : (
        <p className="sb-empty">
          No playground entries. Add playground.ts in the project.
        </p>
      )}
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
    <div className="sb-shell">
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
        {/* Left: scene / component picker + props inspector */}
        <Explorer
          mode={mode}
          onModeChange={(next) => {
            setPlaying(false);
            setPgPlaying(false);
            setMode(next);
          }}
          items={mode === "video" ? videoItems : playgroundItems}
          selectedId={mode === "video" ? selectedVideoId : pgId}
          onSelect={(id) => {
            if (mode === "playground") {
              setPgId(id);
              return;
            }
            const segment = segments.find((entry) => entry.key === id);
            if (segment) {
              setPlaying(false);
              setFrame(segment.startFrame);
            }
          }}
        >
          {mode === "playground" && entry ? (
            <div className="sb-props">
              <h2>Props</h2>
              <PropFields
                key={entry.id}
                values={appliedProps}
                onChange={(next) => {
                  setAppliedProps(next);
                  setPgFrame(0);
                }}
              />
            </div>
          ) : null}
        </Explorer>

        {stage}
      </div>

      {/* Bottom: transport + clip track */}
      {mode === "video" ? (
        <Timeline
          frame={frame}
          durationInFrames={duration}
          fps={manifest.fps}
          playing={playing}
          onPlayingChange={setPlaying}
          onFrameChange={setFrame}
          segments={segments}
        />
      ) : (
        <Timeline
          frame={pgFrame}
          durationInFrames={pgDuration}
          fps={manifest.fps}
          playing={pgPlaying}
          onPlayingChange={setPgPlaying}
          onFrameChange={setPgFrame}
          segments={[
            {
              key: entry?.id ?? "component",
              kind: "scene",
              title: entry?.id ?? "Component",
              startFrame: 0,
              durationInFrames: pgDuration,
            },
          ]}
        />
      )}
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
        boxShadow: embed ? undefined : undefined,
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

/**
 * Isolated playground component under a local frame clock.
 */
function PlaygroundStage({
  Component,
  props,
  frame,
  durationInFrames,
  fps,
  width,
  height,
  scale,
}: {
  Component: ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
  frame: number;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  scale: number;
}) {
  const config: VideoConfig = {
    id: "playground",
    fps,
    width,
    height,
    durationInFrames,
  };
  return (
    <CompositionFrame width={width} height={height} scale={scale} embed={false}>
      <StoryboardProvider frame={frame} config={config}>
        <Component {...props} />
      </StoryboardProvider>
    </CompositionFrame>
  );
}
