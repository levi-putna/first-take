import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Plus,
} from "lucide-react";

export type ExplorerItem = {
  id: string;
  title: string;
  detail: string;
  tone: string;
  dirty?: boolean;
};

export type ExplorerGroup = {
  trackId: string;
  title: string;
  description?: string;
  dirty?: boolean;
  items: ExplorerItem[];
};

/**
 * Scene list grouped by track, plus a props inspector for the selection.
 */
export function Explorer({
  groups,
  selectedId,
  onSelect,
  onTrackTitleChange,
  onTrackDescriptionChange,
  onTrackMoveUp,
  onTrackMoveDown,
  onAddTrack,
  children,
}: {
  groups: ExplorerGroup[];
  selectedId: string;
  onSelect: (id: string) => void;
  onTrackTitleChange?: (args: { trackId: string; title: string }) => void;
  onTrackDescriptionChange?: (args: {
    trackId: string;
    description: string;
  }) => void;
  onTrackMoveUp?: (trackId: string) => void;
  onTrackMoveDown?: (trackId: string) => void;
  onAddTrack?: () => void;
  children?: ReactNode;
}) {
  const editable = Boolean(onTrackTitleChange);

  return (
    <aside className="sb-sidebar">
      {/* Scene list */}
      <div className="sb-list" role="listbox" aria-label="Scenes">
        {editable ? (
          <div className="sb-track-toolbar">
            <button
              type="button"
              className="sb-add-btn sb-add-track-btn"
              onClick={() => onAddTrack?.()}
            >
              <Plus size={14} aria-hidden />
              Add track
            </button>
          </div>
        ) : null}

        {groups.length === 0 ? (
          <p className="sb-hint">No scenes in this video.</p>
        ) : (
          groups.map((group, groupIndex) => (
            <div key={group.trackId} className="sb-track-group">
              {/* Track heading */}
              <div className="sb-track-head">
                {editable ? (
                  <>
                    <div className="sb-track-fields">
                      <input
                        className="sb-track-title-input"
                        value={group.title}
                        aria-label={`Track title for ${group.trackId}`}
                        onChange={(event) =>
                          onTrackTitleChange?.({
                            trackId: group.trackId,
                            title: event.target.value,
                          })
                        }
                      />
                      <textarea
                        className="sb-track-description-input"
                        value={group.description ?? ""}
                        rows={2}
                        placeholder="Track description"
                        aria-label={`Track description for ${group.trackId}`}
                        onChange={(event) =>
                          onTrackDescriptionChange?.({
                            trackId: group.trackId,
                            description: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="sb-track-actions">
                      <button
                        type="button"
                        className="sb-icon-btn"
                        aria-label="Move track up"
                        disabled={groupIndex === 0}
                        onClick={() => onTrackMoveUp?.(group.trackId)}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="sb-icon-btn"
                        aria-label="Move track down"
                        disabled={groupIndex === groups.length - 1}
                        onClick={() => onTrackMoveDown?.(group.trackId)}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {group.dirty ? (
                        <span
                          className="sb-dirty-dot"
                          title="Unsaved track changes"
                          aria-label="Unsaved track changes"
                        />
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="sb-list-label">{group.title}</div>
                )}
              </div>

              {/* Scenes on this track */}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sb-row${item.dirty ? " is-dirty" : ""}`}
                  role="option"
                  aria-selected={item.id === selectedId}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="sb-swatch" style={{ background: item.tone }} />
                  <Clapperboard size={14} color="var(--muted)" aria-hidden />
                  <span className="sb-row-copy">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </span>
                  {item.dirty ? (
                    <span
                      className="sb-dirty-dot"
                      title="Unsaved props"
                      aria-label="Unsaved props"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Inspector for the selected scene */}
      {children}
    </aside>
  );
}
