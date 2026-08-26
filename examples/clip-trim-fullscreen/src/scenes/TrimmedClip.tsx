import { AbsoluteFill } from "@storyboard/core";
import { staticFile, Video } from "@storyboard/media";

/**
 * Full-screen source clip trimmed to seconds 10–30 (20s of footage).
 */
export default function TrimmedClip() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Full-bleed trimmed video */}
      <Video
        src={staticFile("assets/clips/broll.mp4")}
        startFrom={10}
        endAt={30}
        muted
        objectFit="cover"
      />
    </AbsoluteFill>
  );
}
