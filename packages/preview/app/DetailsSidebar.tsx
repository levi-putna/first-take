import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Save } from "lucide-react";
import type { Scene, VideoManifest } from "@levi-putna/storyboard-schema";
import { PropFields } from "./PropFields";
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
  trackDirty,
  unsavedCount,
  saving,
  saveError,
  saveHint,
  onClearSelection,
  onRequestSave,
  onPropChange,
  onVideoTitleChange,
  onSceneTitleChange,
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
  trackDirty?: boolean;
  unsavedCount: number;
  saving: boolean;
  saveError: string | null;
  saveHint: string;
  onClearSelection: () => void;
  onRequestSave: () => void;
  onPropChange: (next: Record<string, unknown>) => void;
  onVideoTitleChange: (args: { title: string }) => void;
  onSceneTitleChange: (args: { sceneId: string; title: string }) => void;
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
          {hasSelection ? (
            <button
              type="button"
              className="sb-icon-btn"
              aria-label="Clear selection"
              onClick={onClearSelection}
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
            scene={selectedScene}
            props={selectedProps}
            onPropChange={onPropChange}
            onTitleChange={(title) =>
              onSceneTitleChange({ sceneId: selectedScene.id, title })
            }
          />
        ) : selectedTrack && selectedLane ? (
          <TrackDetails
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
        <div className="sb-field">
          <label htmlFor="video-title">Title</label>
          <input
            id="video-title"
            className="sb-input"
            value={manifest.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
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
      <div className="sb-field">
        <label htmlFor={`track-title-${trackId}`}>Title</label>
        <input
          id={`track-title-${trackId}`}
          className="sb-input"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </div>
      <div className="sb-field">
        <label htmlFor={`track-desc-${trackId}`}>Description</label>
        <textarea
          id={`track-desc-${trackId}`}
          className="sb-textarea"
          value={description ?? ""}
          rows={3}
          placeholder="Track description"
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>
      <div className="sb-track-actions sb-details-track-actions">
        <button
          type="button"
          className="sb-icon-btn"
          aria-label="Move track up"
          disabled={trackIndex <= 0}
          onClick={onMoveUp}
        >
          <ChevronUp size={14} aria-hidden />
        </button>
        <button
          type="button"
          className="sb-icon-btn"
          aria-label="Move track down"
          disabled={trackIndex < 0 || trackIndex >= trackCount - 1}
          onClick={onMoveDown}
        >
          <ChevronDown size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * Editable scene title with live prop overrides and metadata in a bottom panel.
 */
function SceneDetails({
  scene,
  props,
  onPropChange,
  onTitleChange,
}: {
  scene: Scene;
  props: Record<string, unknown>;
  onPropChange: (next: Record<string, unknown>) => void;
  onTitleChange: (title: string) => void;
}) {
  const [metaOpen, setMetaOpen] = useState(false);

  useEffect(() => {
    setMetaOpen(false);
  }, [scene.id]);

  const transition =
    scene.transitionIn != null
      ? `${scene.transitionIn.type} · ${scene.transitionIn.durationInFrames}f`
      : "None";

  return (
    <div className="sb-stacked-details">
      {/* Primary: editable title, then props */}
      <div className="sb-stacked-details-main">
        <div className="sb-field">
          <label htmlFor={`scene-title-${scene.id}`}>Title</label>
          <input
            id={`scene-title-${scene.id}`}
            className="sb-input"
            value={scene.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
        <PropFields key={scene.id} values={props} onChange={onPropChange} />
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
            label="Duration"
            value={`${scene.durationInFrames}f`}
            mono
          />
          <DetailRow
            label="Gap before"
            value={`${scene.gapBeforeFrames ?? 0}f`}
            mono
          />
          <DetailRow label="Transition in" value={transition} />
        </div>
      </details>
    </div>
  );
}

/**
 * One read-only label/value pair in the details panel.
 */
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
