import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "@levi-putna/storyboard-core";

/**
 * Opaque full-frame background that the overlay tracks sit on.
 */
export default function Background({
  label = "Full-length background",
}: {
  label?: string;
}) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const shift = interpolate(frame, [0, durationInFrames], [0, 40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${160 + shift}deg, #142033 0%, #0b1220 55%, #081018 100%)`,
      }}
    >
      {/* Background label */}
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.18,
          color: "rgba(230, 236, 248, 0.9)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(28, width * 0.036),
          maxWidth: "12em",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}
