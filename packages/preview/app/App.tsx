import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  StoryboardProvider,
  type VideoConfig,
} from "@storyboard/core";
import {
  leadInFrames,
  sceneStartFrames,
  totalDurationInFrames,
} from "@storyboard/schema";
import { CompositionFromManifest } from "@storyboard/transitions";
import { components, manifest } from "./.generated/project";
import { playground } from "./.generated/playground-entry";

type Mode = "video" | "playground";

const isEmbed =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("embed");

/**
 * Preview studio: video scrubber + component playground.
 * With `?embed=1`, hides chrome and accepts host frame control (First Take).
 */
export function App() {
  const [mode, setMode] = useState<Mode>("video");
  const [formatId, setFormatId] = useState(manifest.formats[0].id);
  const format =
    manifest.formats.find((f) => f.id === formatId) ?? manifest.formats[0];
  const duration = totalDurationInFrames(manifest);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lastTs = useRef<number | null>(null);
  const accum = useRef(0);
  const hostDriven = useRef(isEmbed);

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
        setFrame((f) => {
          const next = f + steps;
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

  const scale = isEmbed
    ? Math.min(viewport.w / format.width, viewport.h / format.height)
    : Math.min(1, 900 / format.width, 500 / format.height);

  const markers = useMemo(() => {
    const lead = leadInFrames(manifest);
    return [lead, ...sceneStartFrames(manifest)];
  }, []);

  // Playground state
  const [pgId, setPgId] = useState(playground[0]?.id ?? "");
  const entry = playground.find((p) => p.id === pgId);
  const [propsText, setPropsText] = useState(
    JSON.stringify(entry?.defaultProps ?? {}, null, 2),
  );
  const [appliedProps, setAppliedProps] = useState<Record<string, unknown>>(
    entry?.defaultProps ?? {},
  );
  const [pgFrame, setPgFrame] = useState(0);
  const [pgPlaying, setPgPlaying] = useState(false);
  const pgDuration = entry?.durationInFrames ?? 90;

  useEffect(() => {
    if (!entry) return;
    setPropsText(JSON.stringify(entry.defaultProps, null, 2));
    setAppliedProps(entry.defaultProps);
    setPgFrame(0);
  }, [pgId]);

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
        setPgFrame((f) => {
          const next = f + steps;
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

  const stage = (
    <main
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isEmbed
          ? "#000"
          : "radial-gradient(ellipse at center, #1a2030 0%, #0c0e14 70%)",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {mode === "video" ? (
        <div
          style={{
            width: format.width * scale,
            height: format.height * scale,
            boxShadow: isEmbed ? undefined : "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: format.width,
              height: format.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
              overflow: "hidden",
              background: "#000",
            }}
          >
            <StoryboardProvider frame={frame} config={config}>
              <CompositionFromManifest
                manifest={manifest}
                components={components}
              />
            </StoryboardProvider>
          </div>
        </div>
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
        <p style={{ color: "var(--muted)" }}>
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

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 280,
          background: "var(--panel)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderRight: "1px solid #2a3144",
        }}
      >
        <strong style={{ fontSize: 18 }}>Storyboard</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setMode("video")}>
            Video
          </button>
          <button type="button" onClick={() => setMode("playground")}>
            Playground
          </button>
        </div>

        {mode === "video" ? (
          <>
            <label style={{ color: "var(--muted)", fontSize: 12 }}>
              Format
              <select
                value={formatId}
                onChange={(e) => setFormatId(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              >
                {manifest.formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id} ({f.width}×{f.height})
                  </option>
                ))}
              </select>
            </label>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {manifest.title}
              <br />
              Frame {frame} / {duration - 1}
            </div>
            <input
              type="range"
              min={0}
              max={duration - 1}
              value={frame}
              onChange={(e) => setFrame(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={() => setFrame(0)}>
                Reset
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Markers: {markers.join(", ")}
            </div>
          </>
        ) : (
          <>
            <label style={{ color: "var(--muted)", fontSize: 12 }}>
              Component
              <select
                value={pgId}
                onChange={(e) => setPgId(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              >
                {playground.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ color: "var(--muted)", fontSize: 12 }}>
              Props JSON
              <textarea
                value={propsText}
                onChange={(e) => setPropsText(e.target.value)}
                rows={10}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(propsText) as Record<
                    string,
                    unknown
                  >;
                  setAppliedProps(parsed);
                  setPgFrame(0);
                } catch (err) {
                  alert(`Invalid JSON: ${err}`);
                }
              }}
            >
              Apply props (restart)
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, pgDuration - 1)}
              value={pgFrame}
              onChange={(e) => setPgFrame(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <button type="button" onClick={() => setPgPlaying((p) => !p)}>
              {pgPlaying ? "Pause" : "Play"}
            </button>
          </>
        )}
      </aside>

      {stage}
    </div>
  );
}

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
    <div style={{ width: width * scale, height: height * scale }}>
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
        <StoryboardProvider frame={frame} config={config}>
          <Component {...props} />
        </StoryboardProvider>
      </div>
    </div>
  );
}
