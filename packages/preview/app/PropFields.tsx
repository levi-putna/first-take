import { useId } from "react";

/**
 * Storybook-style controls inferred from a JSON-friendly props object.
 * Text and numbers commit on blur / Enter so typing does not restart every keystroke.
 */
export function PropFields({
  values,
  onChange,
}: {
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    return <p className="sb-hint">This component has no default props.</p>;
  }

  return (
    <div>
      {entries.map(([name, value]) => (
        <PropControl
          key={name}
          name={name}
          value={value}
          onChange={(nextValue) => onChange({ ...values, [name]: nextValue })}
        />
      ))}
    </div>
  );
}

/**
 * One typed control for a single prop.
 */
function PropControl({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const id = useId();

  if (typeof value === "boolean") {
    return (
      <div className="sb-field-row">
        <label htmlFor={id}>{name}</label>
        <button
          id={id}
          type="button"
          className="sb-toggle"
          aria-pressed={value}
          aria-label={name}
          onClick={() => onChange(!value)}
        >
          <span />
        </button>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="sb-field">
        <label htmlFor={id}>{name}</label>
        <input
          id={id}
          className="sb-input"
          type="number"
          defaultValue={value}
          onBlur={(event) => {
            const next = Number(event.target.value);
            if (!Number.isNaN(next)) onChange(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") (event.target as HTMLInputElement).blur();
          }}
        />
      </div>
    );
  }

  if (typeof value === "string") {
    const isColour = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
      value,
    );
    return (
      <div className="sb-field">
        <label htmlFor={id}>{name}</label>
        <div style={{ display: "flex", gap: 8 }}>
          {isColour ? (
            <input
              aria-label={`${name} colour`}
              type="color"
              value={value.length === 4 ? expandShortHex(value) : value.slice(0, 7)}
              onChange={(event) => onChange(event.target.value)}
              style={{ width: 36, height: 32, padding: 0, border: 0, background: "transparent" }}
            />
          ) : null}
          <input
            id={id}
            className="sb-input"
            type="text"
            defaultValue={value}
            onBlur={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") (event.target as HTMLInputElement).blur();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sb-field">
      <label htmlFor={id}>{name} (JSON)</label>
      <textarea
        id={id}
        className="sb-textarea"
        defaultValue={JSON.stringify(value, null, 2)}
        onBlur={(event) => {
          try {
            onChange(JSON.parse(event.target.value) as unknown);
          } catch {
            // Keep the previous value if the JSON is still incomplete.
          }
        }}
      />
    </div>
  );
}

/**
 * Expand #rgb to #rrggbb for native colour inputs.
 */
function expandShortHex(value: string): string {
  const h = value.slice(1);
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}
