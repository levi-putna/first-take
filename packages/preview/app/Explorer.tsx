import type { ReactNode } from "react";
import { Clapperboard } from "lucide-react";

export type ExplorerItem = {
  id: string;
  title: string;
  detail: string;
  tone: string;
};

export type ExplorerGroup = {
  trackId: string;
  title: string;
  items: ExplorerItem[];
};

/**
 * Scene list grouped by track, plus a props inspector for the selection.
 */
export function Explorer({
  groups,
  selectedId,
  onSelect,
  children,
}: {
  groups: ExplorerGroup[];
  selectedId: string;
  onSelect: (id: string) => void;
  children?: ReactNode;
}) {
  return (
    <aside className="sb-sidebar">
      {/* Scene list */}
      <div className="sb-list" role="listbox" aria-label="Scenes">
        {groups.length === 0 ? (
          <p className="sb-hint">No scenes in this video.</p>
        ) : (
          groups.map((group) => (
            <div key={group.trackId}>
              <div className="sb-list-label">{group.title}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="sb-row"
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
