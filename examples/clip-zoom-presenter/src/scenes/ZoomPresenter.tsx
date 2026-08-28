import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { staticFile, Video } from "first-take/media";

/**
 * Full-screen presenter: zoom in, hold ~5s, then zoom back out.
 * Timeline @ 30fps: 0–1s in, 1–6s hold, 6–8s out.
 */
export default function ZoomPresenter() {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const zoomInEnd = fps; // 1s
  const holdEnd = fps + fps * 5; // +5s hold
  const zoomOutEnd = holdEnd + fps; // +1s out → 7s, remainder settles

  const scale = interpolate(
    frame,
    [0, zoomInEnd, holdEnd, zoomOutEnd],
    [1, 1.45, 1.45, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const labelOpacity = interpolate(
    frame,
    [0, 15, holdEnd - 10, holdEnd + 20],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  let phase = "Zooming in";
  if (frame >= zoomInEnd && frame < holdEnd) phase = "Holding zoom";
  else if (frame >= holdEnd) phase = "Zooming out";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Full-screen video with Ken Burns-style zoom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <Video
          src={staticFile("assets/clips/presenter.mp4")}
          startFrom={0}
          endAt={8}
          muted
          objectFit="cover"
        />
      </div>

      {/* Phase label */}
      <div
        style={{
          position: "absolute",
          left: width * 0.05,
          bottom: width * 0.04,
          opacity: labelOpacity,
          color: "#fff",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(20, width * 0.028),
          textShadow: "0 2px 14px rgba(0,0,0,0.65)",
        }}
      >
        {phase}
      </div>
    </AbsoluteFill>
  );
}
