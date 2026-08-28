import { AbsoluteFill } from "first-take";
import { staticFile, Video } from "first-take/media";

/**
 * Mouse and keyboard overlay so the studio actions stay readable.
 * Record this layer on black (or transparent). Mix-blend screen drops black out.
 */
export default function CursorKeys({
  src = "assets/clips/cursor-keys.mp4",
  startFrom = 0,
}: {
  src?: string;
  startFrom?: number;
}) {
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {/* Cursor + keycaps overlay */}
      <Video
        src={staticFile(src)}
        startFrom={startFrom}
        muted
        objectFit="cover"
      />
    </AbsoluteFill>
  );
}
