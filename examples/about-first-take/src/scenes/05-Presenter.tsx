import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { staticFile, Video } from "first-take/media";
import { theme } from "../components/theme";

/**
 * Talking-head picture-in-picture over the studio recording.
 * Visual only: clip audio is muted so narration stays clear.
 */
export default function PresenterPip({
  src = "assets/clips/presenter.mp4",
  startFrom = 0,
}: {
  src?: string;
  startFrom?: number;
}) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const opacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pipWidth = Math.round(width * 0.22);
  const pipHeight = Math.round(pipWidth * (9 / 16));
  const pad = Math.round(width * 0.03);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Presenter PIP, bottom left */}
      <div
        style={{
          position: "absolute",
          left: pad,
          bottom: pad,
          width: pipWidth,
          height: pipHeight,
          opacity,
          borderRadius: theme.radiusSm,
          overflow: "hidden",
          border: `2px solid ${theme.magenta}`,
          boxShadow: "0 12px 40px rgba(26, 6, 18, 0.45)",
          backgroundColor: theme.plum,
        }}
      >
        <Video
          src={staticFile(src)}
          startFrom={startFrom}
          muted
          objectFit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </AbsoluteFill>
  );
}
