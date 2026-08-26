import { useEffect, useRef, type MouseEvent } from "react";
import { ArrowLeft, Pause, Play, SkipBack, Volume2, VolumeX } from "lucide-react";
import { formatFlooredTimecode, formatTimecode, majorRulerStepFrames } from "./timecode";
import type { TimelineLane } from "./timelineModel";

const LABEL_WIDTH = 96;
const RULER_HEIGHT = 28;

/**
 * Bottom editor dock: transport, time ruler, and one lane per track.
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
  const span = Math.max(1, durationInFrames);
  const playheadPct = (frame / span) * 100;
  const rulerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const seekFromClientX = (clientX: number) => {
    const rect = rulerRef.current?.getBoundingClientRect();
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

  const majorStep = majorRulerStepFrames({ durationInFrames, fps });
  const ticks: number[] = [];
  for (let f = 0; f <= durationInFrames; f += majorStep) {
    ticks.push(f);
  }

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

      {/* Ruler + lanes */}
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

          <div className="sb-timeline-scroll">
            <div className="sb-timeline-stack">
              {/* Time ruler */}
              <div
                ref={rulerRef}
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
                    style={{
                      left: `${(tick / span) * 100}%`,
                    }}
                  >
                    <span>{formatFlooredTimecode({ frame: tick, fps })}</span>
                  </div>
                ))}
              </div>

              {lanes.map((lane, laneIndex) => (
                <div key={lane.trackId} className="sb-lane">
                  {lane.clips.map((clip) => {
                    const left = (clip.startFrame / span) * 100;
                    const width = (clip.durationInFrames / span) * 100;
                    return (
                      <button
                        key={clip.key}
                        type="button"
                        className={`sb-clip${selectedSceneId === clip.sceneId ? " is-current" : ""}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
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
                    );
                  })}
                </div>
              ))}

              {/* Playhead overlay: diamond in ruler, stem through lanes */}
              <div className="sb-playhead" style={{ left: `${playheadPct}%` }}>
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
    </div>
  );
}

/**
 * Quiet alternating lane colours.
 */
function clipTone(laneIndex: number): string {
  return laneIndex % 2 === 0 ? "var(--scene-a)" : "var(--scene-b)";
}
