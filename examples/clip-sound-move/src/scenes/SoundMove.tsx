import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { staticFile, Video } from "first-take/media";

/**
 * Sound-on clip that drifts around the frame to show animated positioning.
 */
export default function SoundMove() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cardW = Math.round(width * 0.55);
  const cardH = Math.round(cardW * (9 / 16));

  // Drift path: lower-left → upper-right → centre-left
  const x = interpolate(
    frame,
    [0, 80, 160, 240],
    [width * 0.06, width * 0.38, width * 0.12, width * 0.22],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const y = interpolate(
    frame,
    [0, 80, 160, 240],
    [height * 0.42, height * 0.08, height * 0.28, height * 0.18],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rotate = interpolate(frame, [0, 120, 240], [-3, 2.5, -1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 40, 200, 240], [0.92, 1, 1, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #243247 0%, #0c1018 55%, #07090e 100%)",
      }}
    >
      {/* Soft backdrop panel */}
      <div
        style={{
          position: "absolute",
          inset: "12%",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}
      />

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          left: width * 0.06,
          top: height * 0.08,
          color: "rgba(240,245,255,0.9)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(22, width * 0.028),
        }}
      >
        Video with sound — animated position
      </div>

      {/* Moving video card */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: cardW,
          height: cardH,
          borderRadius: 16,
          overflow: "hidden",
          transform: `rotate(${rotate}deg) scale(${scale})`,
          transformOrigin: "center center",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          border: "2px solid rgba(255,255,255,0.18)",
          background: "#000",
        }}
      >
        <Video
          src={staticFile("assets/clips/with-sound.mp4")}
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
