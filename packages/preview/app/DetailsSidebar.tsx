import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Plus, Save } from "lucide-react";
import type { Scene, VideoManifest } from "@levi-putna/storyboard-schema";
import { PropFields } from "./PropFields";
import {
  clampDurationInFrames,
  formatDurationSeconds,
  parseDurationInput,
} from "./durationInput";
import { formatTimecode } from "./timecode";
import type { TimelineLane } from "./timelineModel";

/**
 * Right-hand details panel: video, track, or scene metadata driven by timeline selection.
 */
export function DetailsSidebar({
  manifest,
  compositionDuration,
  fullLanes,
  selectedSceneId,
  selectedTrackId,
  selectedScene,
  selectedProps,
  isolated = false,
  trackDirty,
  unsavedCount,
  saving,
  saveError,
  saveHint,
  onBack,
  onRequestSave,
  onPropChange,
  onVideoTitleChange,
  onSceneTitleChange,
  onSceneDurationChange,
  onTrackTitleChange,
  onTrackDescriptionChange,
  onTrackMoveUp,
  onTrackMoveDown,
}: {
  manifest: VideoManifest;
  compositionDuration: number;
  fullLanes: TimelineLane[];
  selectedSceneId: string | null;
  selectedTrackId: string | null;
  selectedScene?: Scene;
  selectedProps: Record<string, unknown>;
  isolated?: boolean;
  trackDirty?: boolean;
  unsavedCount: number;
  saving: boolean;
  saveError: string | null;
  saveHint: string;
  onBack: () => void;
  onRequestSave: () => void;
  onPropChange: (next: Record<string, unknown>) => void;
  onVideoTitleChange: (args: { title: string }) => void;
  onSceneTitleChange: (args: { sceneId: string; title: string }) => void;
  onSceneDurationChange: (args: {
    sceneId: string;
    durationInFrames: number;
  }) => void;
  onTrackTitleChange: (args: { trackId: string; title: string }) => void;
  onTrackDescriptionChange: (args: {
    trackId: string;
    description: string;
  }) => void;
  onTrackMoveUp: (trackId: string) => void;
  onTrackMoveDown: (trackId: string) => void;
}) {
  const hasSelection = Boolean(selectedSceneId || selectedTrackId);
  const stackedMetaLayout = Boolean(selectedScene) || !hasSelection;
  const selectedLane = selectedTrackId
    ? fullLanes.find((lane) => lane.trackId === selectedTrackId)
    : undefined;
  const selectedTrack = selectedTrackId
    ? manifest.tracks.find((track) => track.id === selectedTrackId)
    : undefined;
  const trackIndex = selectedTrackId
    ? manifest.tracks.findIndex((track) => track.id === selectedTrackId)
    : -1;

  const headerTitle = selectedScene
    ? selectedScene.title
    : selectedLane
      ? selectedLane.title
      : manifest.title;

  return (
    <aside className="sb-sidebar sb-details-sidebar">
      {/* Details header aligned with the main app header */}
      <header className="sb-details-header">
        <div className="sb-details-title">
          {hasSelection || isolated ? (
            <button
              type="button"
              className="sb-icon-btn"
              aria-label={isolated ? "Back to full timeline" : "Clear selection"}
              onClick={onBack}
            >
              <ArrowLeft size={16} aria-hidden />
            </button>
          ) : null}
          <strong className="sb-details-heading">{headerTitle}</strong>
        </div>
        <div className="sb-details-actions">
          {unsavedCount > 0 ? (
            <span className="sb-unsaved">Unsaved</span>
          ) : null}
          <button
            type="button"
            className="sb-save-btn"
            disabled={unsavedCount === 0 || saving}
            title={`Save to video.json (${saveHint})`}
            onClick={onRequestSave}
          >
            <Save size={14} aria-hidden />
            {saving
              ? "Saving…"
              : unsavedCount > 1
                ? `Save ${unsavedCount}`
                : "Save"}
          </button>
        </div>
      </header>

      {/* Scrollable details body */}
      <div
        className={`sb-details-body${stackedMetaLayout ? " is-stacked-meta" : ""}`}
      >
        {saveError ? <p className="sb-error sb-details-error">{saveError}</p> : null}

        {selectedScene ? (
          <SceneDetails
            key={selectedScene.id}
            scene={selectedScene}
            fps={manifest.fps}
            maxDurationInFrames={maxClipDurationInFrames({
              lanes: fullLanes,
              sceneId: selectedScene.id,
            })}
            props={selectedProps}
            onPropChange={onPropChange}
            onTitleChange={(title) =>
              onSceneTitleChange({ sceneId: selectedScene.id, title })
            }
            onDurationChange={({ durationInFrames }) =>
              onSceneDurationChange({
                sceneId: selectedScene.id,
                durationInFrames,
              })
            }
          />
        ) : selectedTrack && selectedLane ? (
          <TrackDetails
            key={selectedTrack.id}
            trackId={selectedTrack.id}
            title={selectedLane.title}
            description={selectedLane.description}
            sceneCount={selectedLane.clips.length}
            trackIndex={trackIndex}
            trackCount={manifest.tracks.length}
            dirty={trackDirty}
            onTitleChange={(title) =>
              onTrackTitleChange({ trackId: selectedTrack.id, title })
            }
            onDescriptionChange={(description) =>
              onTrackDescriptionChange({
                trackId: selectedTrack.id,
                description,
              })
            }
            onMoveUp={() => onTrackMoveUp(selectedTrack.id)}
            onMoveDown={() => onTrackMoveDown(selectedTrack.id)}
          />
        ) : (
          <VideoDetails
            key={manifest.slug}
            manifest={manifest}
            compositionDuration={compositionDuration}
            onTitleChange={(title) => onVideoTitleChange({ title })}
          />
        )}
      </div>
    </aside>
  );
}

/**
 * Editable video title with the rest of the metadata in a bottom collapsible panel.
 */
function VideoDetails({
  manifest,
  compositionDuration,
  onTitleChange,
}: {
  manifest: VideoManifest;
  compositionDuration: number;
  onTitleChange: (title: string) => void;
}) {
  const [metaOpen, setMetaOpen] = useState(false);

  return (
    <div className="sb-stacked-details">
      {/* Primary: editable title */}
      <div className="sb-stacked-details-main">
        <BlurCommitField
          id="video-title"
          label="Title"
          value={manifest.title}
          onCommit={onTitleChange}
        />
      </div>

      {/* Secondary: read-only metadata at the bottom (collapsed by default) */}
      <details
        className="sb-details-meta"
        open={metaOpen}
        onToggle={(event) => setMetaOpen(event.currentTarget.open)}
      >
        <summary className="sb-details-meta-summary">
          <ChevronDown size={14} className="sb-details-meta-chevron" aria-hidden />
          Metadata
        </summary>
        <div className="sb-details-meta-body">
          <DetailRow label="Slug" value={manifest.slug} mono />
          <DetailRow label="FPS" value={String(manifest.fps)} mono />
          <DetailRow
            label="Duration"
            value={`${compositionDuration}f · ${formatTimecode({
              frame: compositionDuration,
              fps: manifest.fps,
            })}`}
            mono
          />
          <DetailRow label="Assets root" value={manifest.assetsRoot} mono />
          <DetailRow label="Schema" value={String(manifest.schemaVersion)} mono />
          <div className="sb-details-group">
            <span className="sb-details-field-label">Formats</span>
            <ul className="sb-details-list">
              {manifest.formats.map((entry) => (
                <li key={entry.id} className="sb-mono">
                  {entry.id} · {entry.aspectRatio} · {entry.width}x{entry.height}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

/**
 * Editable track metadata when a timeline lane is selected.
 */
function TrackDetails({
  trackId,
  title,
  description,
  sceneCount,
  trackIndex,
  trackCount,
  dirty,
  onTitleChange,
  onDescriptionChange,
  onMoveUp,
  onMoveDown,
}: {
  trackId: string;
  title: string;
  description?: string;
  sceneCount: number;
  trackIndex: number;
  trackCount: number;
  dirty?: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="sb-details-section">
      <div className="sb-details-section-head">
        <h2 className="sb-details-label">Track</h2>
        {dirty ? (
          <span
            className="sb-dirty-dot"
            title="Unsaved track changes"
            aria-label="Unsaved track changes"
          />
        ) : null}
      </div>
      <DetailRow label="ID" value={trackId} mono />
      <DetailRow label="Scenes" value={String(sceneCount)} mono />
      <BlurCommitField
        id={`track-title-${trackId}`}
        label="Title"
        value={title}
        onCommit={onTitleChange}
      />
      <BlurCommitField
        id={`track-desc-${trackId}`}
        label="Description"
        value={description ?? ""}
        multiline
        rows={3}
        placeholder="Track description"
        onCommit={onDescriptionChange}
      />

      {/* Timeline order: labelled stepper so drag is not the only way to rearrange */}
      <TrackOrderField
        trackId={trackId}
        trackTitle={title}
        trackIndex={trackIndex}
        trackCount={trackCount}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    </div>
  );
}

/**
 * Editable scene title and duration with live prop overrides and metadata in a bottom panel.
 */
function SceneDetails({
  scene,
  fps,
  maxDurationInFrames,
  props,
  onPropChange,
  onTitleChange,
  onDurationChange,
}: {
  scene: Scene;
  fps: number;
  maxDurationInFrames: number | null;
  props: Record<string, unknown>;
  onPropChange: (next: Record<string, unknown>) => void;
  onTitleChange: (title: string) => void;
  onDurationChange: (args: { durationInFrames: number }) => void;
}) {
  const [metaOpen, setMetaOpen] = useState(false);

  useEffect(() => {
    setMetaOpen(false);
  }, [scene.id]);

  return (
    <div className="sb-stacked-details">
      {/* Primary: editable title and duration, then component props */}
      <div className="sb-stacked-details-main">
        {/* Scene name in the editor — not a rendered page element */}
        <BlurCommitField
          id={`scene-title-${scene.id}`}
          label="Title"
          value={scene.title}
          onCommit={onTitleChange}
        />

        {/* Fine-grained duration: time in, frames stored at project fps */}
        <DurationField
          sceneId={scene.id}
          durationInFrames={scene.durationInFrames}
          fps={fps}
          maxDurationInFrames={maxDurationInFrames}
          onCommit={onDurationChange}
        />

        {/* Props that the scene component actually receives */}
        <div className="sb-details-section sb-details-props">
          <div className="sb-details-section-head">
            <h2 className="sb-details-label">Props</h2>
          </div>
          <PropFields key={scene.id} values={props} onChange={onPropChange} />
        </div>
      </div>

      {/* Secondary: read-only metadata at the bottom (collapsed by default) */}
      <details
        className="sb-details-meta"
        open={metaOpen}
        onToggle={(event) => setMetaOpen(event.currentTarget.open)}
      >
        <summary className="sb-details-meta-summary">
          <ChevronDown size={14} className="sb-details-meta-chevron" aria-hidden />
          Metadata
        </summary>
        <div className="sb-details-meta-body">
          <DetailRow label="ID" value={scene.id} mono />
          <DetailRow label="Component" value={scene.component} mono />
          <DetailRow label="Visual type" value={scene.visualType} />
          <DetailRow
            label="Gap before"
            value={`${scene.gapBeforeFrames ?? 0}f`}
            mono
          />
        </div>
      </details>
    </div>
  );
}

/**
 * Time-based duration editor that snaps to whole frames at the project frame rate.
 */
function DurationField({
  sceneId,
  durationInFrames,
  fps,
  maxDurationInFrames,
  onCommit,
}: {
  sceneId: string;
  durationInFrames: number;
  fps: number;
  maxDurationInFrames: number | null;
  onCommit: (args: { durationInFrames: number }) => void;
}) {
  const formatted = formatDurationSeconds({ frames: durationInFrames, fps });
  const [draft, setDraft] = useState(formatted);
  const inputId = `scene-duration-${sceneId}`;
  const framesId = `${inputId}-frames`;
  const hintId = `${inputId}-hint`;
  const atMinimum = durationInFrames <= 1;
  const atMaximum =
    maxDurationInFrames != null && durationInFrames >= maxDurationInFrames;
  const limitHint = atMinimum
    ? "Duration is already one frame."
    : atMaximum
      ? "The next clip starts here. Move it on the timeline to make room."
      : null;

  useEffect(() => {
    setDraft(formatted);
  }, [formatted]);

  /**
   * Write a snapped, clamped frame count when it differs from the current duration.
   */
  function commitFrames({ frames }: { frames: number }) {
    const next = clampDurationInFrames({
      durationInFrames: frames,
      maxDurationInFrames,
    });
    setDraft(formatDurationSeconds({ frames: next, fps }));
    if (next !== durationInFrames) {
      onCommit({ durationInFrames: next });
    }
  }

  /**
   * Parse the draft as time and snap it to fps, or revert if it is not valid.
   */
  function commitDraft() {
    const parsed = parseDurationInput({ text: draft, fps });
    if (!parsed.ok) {
      setDraft(formatted);
      return;
    }
    commitFrames({ frames: parsed.frames });
  }

  /**
   * Nudge duration by a whole-frame step from the stepper or arrow keys.
   * Uses the draft when it is valid time so in-progress edits are not discarded.
   */
  function nudge({ deltaFrames }: { deltaFrames: number }) {
    const parsed = parseDurationInput({ text: draft, fps });
    const base = parsed.ok ? parsed.frames : durationInFrames;
    commitFrames({ frames: base + deltaFrames });
  }

  return (
    <div className="sb-field">
      <label htmlFor={inputId}>Duration</label>
      <div className="sb-duration-control">
        {/* Time input with a visible seconds unit, plus frame steppers */}
        <div className="sb-duration-control-row">
          <div className="sb-duration-input-wrap">
            <input
              id={inputId}
              className="sb-duration-input"
              value={draft}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={
                limitHint ? `${framesId} ${hintId}` : framesId
              }
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitDraft}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  (event.target as HTMLInputElement).blur();
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  nudge({ deltaFrames: 1 });
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  nudge({ deltaFrames: -1 });
                }
              }}
            />
            <abbr className="sb-duration-unit" title="Seconds">
              s
            </abbr>
          </div>
          <div className="sb-duration-stepper" role="group" aria-label="Nudge by one frame">
            <button
              type="button"
              className="sb-duration-stepper-btn"
              aria-label="Decrease duration by one frame"
              title="Decrease duration by one frame"
              disabled={atMinimum}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => nudge({ deltaFrames: -1 })}
            >
              <Minus size={14} aria-hidden />
            </button>
            <button
              type="button"
              className="sb-duration-stepper-btn"
              aria-label="Increase duration by one frame"
              title="Increase duration by one frame"
              disabled={atMaximum}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => nudge({ deltaFrames: 1 })}
            >
              <Plus size={14} aria-hidden />
            </button>
          </div>
        </div>

        {/* Non-editable: the snapped frame count at this project's fps */}
        <p id={framesId} className="sb-duration-meta">
          {durationInFrames} {durationInFrames === 1 ? "frame" : "frames"} at {fps}{" "}
          fps
        </p>
      </div>
      {limitHint ? (
        <p id={hintId} className="sb-field-hint">
          {limitHint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Longest duration this clip can take before overlapping the next clip on its lane.
 */
function maxClipDurationInFrames({
  lanes,
  sceneId,
}: {
  lanes: TimelineLane[];
  sceneId: string;
}): number | null {
  for (const lane of lanes) {
    const clips = [...lane.clips].sort(
      (left, right) => left.startFrame - right.startFrame,
    );
    const index = clips.findIndex((clip) => clip.sceneId === sceneId);
    if (index < 0) continue;
    const current = clips[index];
    const next = clips[index + 1];
    if (!current || !next) return null;
    return Math.max(1, next.startFrame - current.startFrame);
  }
  return null;
}

/**
 * Labelled timeline-order field with a readout and Move up / Move down actions.
 */
function TrackOrderField({
  trackId,
  trackTitle,
  trackIndex,
  trackCount,
  onMoveUp,
  onMoveDown,
}: {
  trackId: string;
  trackTitle: string;
  trackIndex: number;
  trackCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const copy = trackOrderCopy({ trackIndex, trackCount });
  const labelId = `track-order-${trackId}`;
  const hintId = `track-order-hint-${trackId}`;

  return (
    <div className="sb-field">
      <label id={labelId}>Timeline order</label>
      <div
        className="sb-order-control"
        role="group"
        aria-labelledby={labelId}
        aria-describedby={hintId}
      >
        {/* Current position, in timeline terms rather than paint jargon */}
        <div className="sb-order-control-readout" aria-live="polite">
          <span className="sb-order-control-value">{copy.summary}</span>
          <span className="sb-order-control-meta">{copy.place}</span>
        </div>
        <div className="sb-order-control-buttons">
          <button
            type="button"
            className="sb-order-control-btn"
            aria-label={`Move ${trackTitle} up the timeline`}
            title={copy.upDisabledReason ?? `Move ${trackTitle} up the timeline`}
            disabled={copy.upDisabledReason != null}
            onClick={onMoveUp}
          >
            <ChevronUp size={14} aria-hidden />
            Move up
          </button>
          <button
            type="button"
            className="sb-order-control-btn"
            aria-label={`Move ${trackTitle} down the timeline`}
            title={copy.downDisabledReason ?? `Move ${trackTitle} down the timeline`}
            disabled={copy.downDisabledReason != null}
            onClick={onMoveDown}
          >
            <ChevronDown size={14} aria-hidden />
            Move down
          </button>
        </div>
      </div>
      <p id={hintId} className="sb-field-hint">
        {copy.hint}
      </p>
    </div>
  );
}

/**
 * Inspector copy for a track's position in the timeline stack.
 */
function trackOrderCopy({
  trackIndex,
  trackCount,
}: {
  trackIndex: number;
  trackCount: number;
}): {
  summary: string;
  place: string;
  hint: string;
  upDisabledReason: string | null;
  downDisabledReason: string | null;
} {
  const canReorder = trackCount > 1;
  const isFirst = trackIndex <= 0;
  const isLast = trackIndex >= trackCount - 1;
  const position = Math.max(1, trackIndex + 1);
  const summary = `${position} of ${trackCount}`;

  if (!canReorder) {
    return {
      summary,
      place: "Only lane",
      hint: "Add another track to change the order.",
      upDisabledReason: "Add another track to change the order",
      downDisabledReason: "Add another track to change the order",
    };
  }

  let place = `Lane ${position}`;
  let hint =
    "Moves this lane on the timeline. Earlier tracks paint behind later ones.";
  if (isFirst) {
    place = "Top of the timeline";
    hint =
      "At the top of the timeline. This track paints behind the lanes below.";
  } else if (isLast) {
    place = "Bottom of the timeline";
    hint =
      "At the bottom of the timeline. This track paints in front of the lanes above.";
  }

  return {
    summary,
    place,
    hint,
    upDisabledReason: isFirst ? "Already at the top of the timeline" : null,
    downDisabledReason: isLast ? "Already at the bottom of the timeline" : null,
  };
}
function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="sb-detail-row">
      <span className="sb-detail-label">{label}</span>
      <span className={`sb-detail-value${mono ? " sb-mono" : ""}`}>{value}</span>
    </div>
  );
}

/**
 * Text field that commits on blur so typing stays one undo step.
 */
function BlurCommitField({
  id,
  label,
  value,
  onCommit,
  multiline = false,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onCommit: (next: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  /**
   * Push the draft to the parent when the field loses focus.
   */
  function commitDraft() {
    if (draft !== value) {
      onCommit(draft);
    }
  }

  if (multiline) {
    return (
      <div className="sb-field">
        <label htmlFor={id}>{label}</label>
        <textarea
          id={id}
          className="sb-textarea"
          value={draft}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
        />
      </div>
    );
  }

  return (
    <div className="sb-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="sb-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}
