import { AbsoluteFill, useVideoConfig } from "@levi-putna/storyboard-core";

/**
 * Transparent lower-third. The rest of the frame stays empty so the background shows through.
 */
export default function OverlayA({
  headline = "First callout",
  detail = "Fades in over empty track after a gap.",
}: {
  headline?: string;
  detail?: string;
}) {
  const { width, height } = useVideoConfig();
  const barHeight = Math.round(height * 0.22);

  return (
    <AbsoluteFill>
      {/* Lower-third bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: barHeight,
          padding: `0 ${width * 0.06}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(90deg, rgba(20, 90, 140, 0.92) 0%, rgba(20, 90, 140, 0.55) 100%)",
        }}
      >
        <div
          style={{
            color: "#f4f8ff",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: Math.max(22, width * 0.028),
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 6,
            color: "rgba(230, 238, 250, 0.8)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: Math.max(14, width * 0.016),
          }}
        >
          {detail}
        </div>
      </div>
    </AbsoluteFill>
  );
}
