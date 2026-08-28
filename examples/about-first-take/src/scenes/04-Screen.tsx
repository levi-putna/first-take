import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "first-take";
import { staticFile, Video } from "first-take/media";
import { theme } from "../components/theme";

/**
 * Full-bleed preview-studio screen recording. Muted under ElevenLabs VO.
 * Swap `src` for the real capture when it is ready.
 */
export default function ScreenRecording({
  src = "assets/clips/screen.mp4",
  startFrom = 0,
}: {
  src?: string;
  startFrom?: number;
}) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.plum, opacity: fadeIn }}>
      {/* Live preview capture */}
      <Video
        src={staticFile(src)}
        startFrom={startFrom}
        muted
        objectFit="cover"
      />
    </AbsoluteFill>
  );
}
