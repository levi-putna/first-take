import { AbsoluteFill } from "@storyboard/core";
import { staticFile, Video } from "@storyboard/media";

/**
 * First shot — b-roll for 5 seconds (hard cut into the next scene).
 */
export default function ClipA() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video
        src={staticFile("assets/clips/broll.mp4")}
        startFrom={10}
        endAt={15}
        muted
        objectFit="cover"
      />
    </AbsoluteFill>
  );
}
