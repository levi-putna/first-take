import type { ReactNode } from "react";
import { Clapperboard, Component } from "lucide-react";

export type ExplorerItem = {
  id: string;
  title: string;
  detail: string;
  tone: string;
};

/**
 * Selectable scene or playground list. Clicking a row is the standard
 * "what am I editing?" control (Figma layers / Storybook stories / NLE bin).
 */
export function Explorer({
  mode,
  onModeChange,
  items,
  selectedId,
  onSelect,
  children,
}: {
  mode: "video" | "playground";
  onModeChange: (mode: "video" | "playground") => void;
  items: ExplorerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  children?: ReactNode;
}) {
  return (
    <aside className="sb-sidebar">
      {/* Video vs component playground */}
      <div className="sb-segmented" role="tablist" aria-label="Studio mode">
        <button
          type="button"
          role="tab"
          aria-pressed={mode === "video"}
          onClick={() => onModeChange("video")}
        >
          Video
        </button>
        <button
          type="button"
          role="tab"
          aria-pressed={mode === "playground"}
          onClick={() => onModeChange("playground")}
        >
          Playground
        </button>
      </div>

      {/* Asset / story list */}
      <div className="sb-list" role="listbox" aria-label={mode === "video" ? "Scenes" : "Components"}>
        <div className="sb-list-label">
          {mode === "video" ? "Scenes" : "Components"}
        </div>
        {items.length === 0 ? (
          <p className="sb-hint">
            {mode === "playground"
              ? "Add a playground.ts next to video.json to isolate components."
              : "No scenes in this video."}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="sb-row"
              role="option"
              aria-selected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
            >
              <span className="sb-swatch" style={{ background: item.tone }} />
              {mode === "video" ? (
                <Clapperboard size={14} color="var(--muted)" aria-hidden />
              ) : (
                <Component size={14} color="var(--muted)" aria-hidden />
              )}
              <span className="sb-row-copy">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </span>
            </button>
          ))
        )}
      </div>

      {/* Inspector for the selected playground component */}
      {children}
    </aside>
  );
}
