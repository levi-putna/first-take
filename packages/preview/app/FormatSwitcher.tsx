import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Plus, Ratio, Smartphone, Square } from "lucide-react";
import type { Format } from "@levi-putna/storyboard-schema";
import {
  availableFormatPresets,
  formatHint,
  ratioFromPixels,
} from "./formatPresets";

/**
 * Top-right format pill: switch the preview size or append a format to video.json.
 */
export function FormatSwitcher({
  formats,
  formatId,
  onFormatChange,
  onFormatAdd,
}: {
  formats: Format[];
  formatId: string;
  onFormatChange: (id: string) => void;
  onFormatAdd: (format: Format) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const rootRef = useRef<HTMLDivElement>(null);
  const active = formats.find((format) => format.id === formatId) ?? formats[0];
  const addable = availableFormatPresets({ formats });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setAdding(false);
        setError(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setAdding(false);
        setError(null);
      }
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const submit = async (format: Format) => {
    setError(null);
    try {
      await onFormatAdd(format);
      onFormatChange(format.id);
      setOpen(false);
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="sb-format" ref={rootRef}>
      <button
        type="button"
        className="sb-format-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Preview format"
        onClick={() => setOpen((value) => !value)}
      >
        <FormatGlyph aspectRatio={active.aspectRatio} />
        {active.aspectRatio}
        <span className="sb-mono" style={{ fontSize: 11 }}>
          {active.width}×{active.height}
        </span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div className="sb-menu" role="menu">
          {formats.map((format) => (
            <button
              key={format.id}
              type="button"
              className="sb-menu-item"
              role="menuitemradio"
              aria-checked={format.id === active.id}
              onClick={() => {
                onFormatChange(format.id);
                setOpen(false);
              }}
            >
              <FormatGlyph aspectRatio={format.aspectRatio} />
              <span style={{ flex: 1 }}>
                {format.aspectRatio}
                <small>{formatHint({ format })}</small>
              </span>
              {format.id === active.id ? <Check size={16} aria-hidden /> : null}
            </button>
          ))}
          <div className="sb-menu-sep" />
          {!adding ? (
            <button
              type="button"
              className="sb-menu-item"
              onClick={() => setAdding(true)}
            >
              <Plus size={16} aria-hidden />
              <span>Add format to video.json</span>
            </button>
          ) : (
            <div style={{ padding: "4px 6px 8px" }}>
              <h3>Add format</h3>
              {addable.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="sb-menu-item"
                  onClick={() => void submit(preset)}
                >
                  <FormatGlyph aspectRatio={preset.aspectRatio} />
                  <span>
                    {preset.aspectRatio}
                    <small>
                      {preset.width}×{preset.height}
                    </small>
                  </span>
                </button>
              ))}
              <div className="sb-field" style={{ marginTop: 8 }}>
                <label htmlFor="custom-w">Custom pixels</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    id="custom-w"
                    className="sb-input"
                    type="number"
                    min={1}
                    value={customWidth}
                    onChange={(event) => setCustomWidth(event.target.value)}
                    aria-label="Width"
                  />
                  <input
                    className="sb-input"
                    type="number"
                    min={1}
                    value={customHeight}
                    onChange={(event) => setCustomHeight(event.target.value)}
                    aria-label="Height"
                  />
                </div>
              </div>
              <button
                type="button"
                className="sb-add-btn"
                onClick={() => {
                  const width = Number(customWidth);
                  const height = Number(customHeight);
                  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
                    setError("Width and height must be positive integers");
                    return;
                  }
                  const aspectRatio = ratioFromPixels({ width, height });
                  const id = `${width}x${height}`;
                  void submit({ id, aspectRatio, width, height });
                }}
              >
                Add {customWidth}×{customHeight}
              </button>
              {error ? <p className="sb-error">{error}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Compact glyph for landscape / portrait / square formats.
 */
function FormatGlyph({ aspectRatio }: { aspectRatio: string }) {
  if (aspectRatio === "9:16" || aspectRatio.startsWith("9:")) {
    return <Smartphone size={16} aria-hidden />;
  }
  if (aspectRatio === "1:1") return <Square size={16} aria-hidden />;
  if (aspectRatio.includes(":")) {
    const [w, h] = aspectRatio.split(":").map(Number);
    if (h > w) return <Ratio size={16} aria-hidden />;
  }
  return <Monitor size={16} aria-hidden />;
}
