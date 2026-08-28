import { AbsoluteFill, useVideoConfig } from "first-take";

/**
 * Solid green scene; layout can read width/height from video config.
 */
export default function Green() {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#00aa44",
        // Touch config so multi-format stills differ by canvas size only
        outline: `${Math.max(1, Math.round(width / 320))}px solid #003311`,
        outlineOffset: `-${Math.max(1, Math.round(height / 180))}px`,
      }}
    />
  );
}
