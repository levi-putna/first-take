import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";
import { staticFile, Video } from "@levi-putna/storyboard-media";

/**
 * Presenter talking-head in the bottom-left, with animated graphics filling the frame.
 */
export default function PresenterPip({
  headline = "Narration lives in the corner.",
  detail = "The rest of the frame is motion graphics.",
}: {
  headline?: string;
  detail?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [28, 0], {
    extrapolateRight: "clamp",
  });
  const detailOpacity = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const orbScale = spring({
    frame,
    fps,
    from: 0.4,
    to: 1,
    durationInFrames: 28,
  });
  const ringSpin = interpolate(frame, [0, fps * 8], [0, 360]);
  const barWidth = interpolate(
    frame,
    [30, 90, 150, 210],
    [0.15, 0.72, 0.4, 0.88],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const pipWidth = Math.round(width * 0.28);
  const pipHeight = Math.round(pipWidth * (9 / 16));
  const pipPad = Math.round(width * 0.04);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 70% 30%, #1d4f6f 0%, #0b1220 55%, #070b14 100%)",
      }}
    >
      {/* Soft animated orb */}
      <div
        style={{
          position: "absolute",
          right: width * 0.12,
          top: height * 0.18,
          width: width * 0.28,
          height: width * 0.28,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, #6ec8ff 0%, #1a6b9a 45%, transparent 70%)",
          opacity: 0.55,
          transform: `scale(${orbScale})`,
        }}
      />

      {/* Orbiting ring */}
      <div
        style={{
          position: "absolute",
          right: width * 0.1,
          top: height * 0.16,
          width: width * 0.32,
          height: width * 0.32,
          borderRadius: "50%",
          border: "2px solid rgba(180, 230, 255, 0.35)",
          transform: `rotate(${ringSpin}deg)`,
        }}
      />

      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          left: width * 0.36,
          bottom: height * 0.22,
          height: 8,
          width: width * barWidth * 0.5,
          borderRadius: 999,
          background: "linear-gradient(90deg, #5ad0ff, #9b7bff)",
          boxShadow: "0 0 24px rgba(90, 208, 255, 0.35)",
        }}
      />

      {/* Copy */}
      <div
        style={{
          position: "absolute",
          left: width * 0.36,
          top: height * 0.28,
          maxWidth: width * 0.5,
          color: "#f4f8ff",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontSize: Math.max(28, width * 0.042),
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            opacity: detailOpacity,
            fontSize: Math.max(16, width * 0.02),
            color: "rgba(220, 230, 245, 0.8)",
            lineHeight: 1.45,
          }}
        >
          {detail}
        </div>
      </div>

      {/* Presenter PIP — bottom left */}
      <div
        style={{
          position: "absolute",
          left: pipPad,
          bottom: pipPad,
          width: pipWidth,
          height: pipHeight,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          border: "2px solid rgba(255,255,255,0.2)",
          background: "#000",
        }}
      >
        <Video
          src={staticFile("assets/clips/presenter.mp4")}
          startFrom={0}
          endAt={8}
          muted={false}
          volume={1}
          objectFit="cover"
        />
      </div>
    </AbsoluteFill>
  );
}
