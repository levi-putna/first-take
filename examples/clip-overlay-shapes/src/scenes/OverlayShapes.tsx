import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "@storyboard/core";
import { staticFile, Video } from "@storyboard/media";

/**
 * Full-screen video with animated shapes composited on top.
 */
export default function OverlayShapes() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Circle — in, hold, out
  const circleProgress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
  });
  const circleOut = interpolate(frame, [150, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const circleOpacity = circleProgress * circleOut;
  const circleScale = 0.7 + circleProgress * 0.3;

  // Square — delayed entrance
  const squareProgress = spring({
    frame: Math.max(0, frame - 20),
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
  });
  const squareOut = interpolate(frame, [170, 200], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const squareOpacity = squareProgress * squareOut;
  const squareRotate = interpolate(frame, [20, 200], [-12, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Capsule bar — later beat
  const barIn = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barOut = interpolate(frame, [190, 220], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barOpacity = barIn * barOut;
  const barX = interpolate(frame, [50, 120], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title chip
  const titleOpacity = interpolate(frame, [8, 28, 200, 230], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Full-screen source */}
      <Video
        src={staticFile("assets/clips/presenter.mp4")}
        startFrom={0}
        endAt={8}
        muted={false}
        volume={0.7}
        objectFit="cover"
      />

      {/* Dim veil so shapes read clearly */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(120deg, rgba(8,12,24,0.35), rgba(8,12,24,0.1))",
        }}
      />

      {/* Circle */}
      <div
        style={{
          position: "absolute",
          left: width * 0.18,
          top: height * 0.22,
          width: width * 0.16,
          height: width * 0.16,
          borderRadius: "50%",
          background: "rgba(94, 214, 255, 0.85)",
          opacity: circleOpacity,
          transform: `scale(${circleScale})`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      />

      {/* Square */}
      <div
        style={{
          position: "absolute",
          right: width * 0.16,
          top: height * 0.28,
          width: width * 0.14,
          height: width * 0.14,
          borderRadius: 18,
          background: "rgba(255, 196, 92, 0.9)",
          opacity: squareOpacity,
          transform: `rotate(${squareRotate}deg)`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      />

      {/* Capsule */}
      <div
        style={{
          position: "absolute",
          left: width * 0.28 + barX,
          bottom: height * 0.2,
          width: width * 0.42,
          height: 56,
          borderRadius: 999,
          background: "rgba(155, 123, 255, 0.92)",
          opacity: barOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(18, width * 0.022),
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        Overlay on real footage
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          left: width * 0.06,
          top: height * 0.08,
          opacity: titleOpacity,
          color: "#fff",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(22, width * 0.032),
          textShadow: "0 2px 16px rgba(0,0,0,0.55)",
        }}
      >
        Shapes over video
      </div>
    </AbsoluteFill>
  );
}
