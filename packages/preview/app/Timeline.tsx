import { useEffect, useRef, type MouseEvent } from "react";
import { Pause, Play, SkipBack } from "lucide-react";
import { formatSeconds, formatTimecode } from "./timecode";
import {
  segmentAtFrame,
  type TimelineSegment,
} from "./timelineModel";

/**
 * Bottom editor dock: transport, current scene / VO window, and a clip track.
 */
export function Timeline({
  frame,
  durationInFrames,
  fps,
  playing,
  onPlayingChange,
  onFrameChange,
  segments,
}: {
  frame: number;
  durationInFrames: number;
  fps: number;
  playing: boolean;
  onPlayingChange: (next: boolean) => void;
  onFrameChange: (next: number) => void;
  segments: TimelineSegment[];
}) {
  const last = Math.max(0, durationInFrames - 1);
  const current = segmentAtFrame({ segments, frame });
  const localFrame = current ? frame - current.startFrame : frame;
  const playheadPct = last === 0 ? 0 : (frame / last) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const audioLabel =
    current?.audioStartSeconds != null && current.audioEndSeconds != null
      ? `VO ${formatSeconds({ seconds: current.audioStartSeconds })}–${formatSeconds({ seconds: current.audioEndSeconds })}`
      : current?.kind === "lead-in"
        ? "Jingle / lead-in"
        : current?.kind === "tail"
          ? "Tail"
          : null;

  const seekFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onFrameChange(Math.round(t * last));
  };

  const seekFromEvent = (event: MouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    seekFromClientX(event.clientX);
  };

  useEffect(() => {
    const onMove = (event: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      seekFromClientX(event.clientX);
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
  }, [last, onFrameChange]);

  return (
    <div className="sb-dock">
      {/* Play / pause + timecode + scene chip */}
      <div className="sb-transport">
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
        <span className="sb-mono">
          {formatTimecode({ frame, fps })} / {formatTimecode({ frame: last, fps })}
        </span>
        <span className="sb-mono">f{frame}</span>
        {current ? (
          <span className="sb-chip" title={current.narration}>
            {current.title}
            <span className="sb-mono" style={{ color: "var(--muted)" }}>
              {localFrame}/{current.durationInFrames - 1}
            </span>
            {audioLabel ? <em>{audioLabel}</em> : null}
          </span>
        ) : null}
      </div>

      {/* Scene track */}
      <div
        ref={trackRef}
        className="sb-track"
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
        <div className="sb-track-row">
          {segments.map((segment, index) => (
            <div
              key={segment.key}
              className={`sb-clip${current?.key === segment.key ? " is-current" : ""}`}
              style={{
                flexGrow: Math.max(1, segment.durationInFrames),
                background: clipTone({ kind: segment.kind, index }),
              }}
              title={`${segment.title} · ${segment.durationInFrames}f`}
            >
              {segment.title}
            </div>
          ))}
        </div>
        <div className="sb-playhead" style={{ left: `${playheadPct}%` }} />
      </div>
    </div>
  );
}

/**
 * Distinct but quiet colours per clip kind.
 */
function clipTone({
  kind,
  index,
}: {
  kind: TimelineSegment["kind"];
  index: number;
}): string {
  if (kind === "lead-in") return "var(--lead)";
  if (kind === "tail") return "var(--tail)";
  return index % 2 === 0 ? "var(--scene-a)" : "var(--scene-b)";
}
