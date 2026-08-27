import { AbsoluteFill } from "@levi-putna/storyboard-core";

/**
 * Full-frame colour strip labelled for multi-track timeline testing.
 */
export default function TrackStrip({
  label,
  hue,
}: {
  label: string;
  hue: number;
}) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: `hsl(${hue}, 55%, 42%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 48,
        fontWeight: 600,
      }}
    >
      {label}
    </AbsoluteFill>
  );
}
