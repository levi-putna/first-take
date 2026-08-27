import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

/**
 * Small corner badge on a third track, overlapping both overlays.
 */
export default function Badge({ label = "LIVE" }: { label?: string }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Corner badge */}
      <div
        style={{
          position: "absolute",
          top: height * 0.06,
          right: width * 0.05,
          padding: "8px 14px",
          borderRadius: 999,
          background: "#e23b3b",
          color: "#fff",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: Math.max(12, width * 0.014),
          letterSpacing: "0.12em",
          fontWeight: 700,
          opacity,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}
