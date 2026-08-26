import { AbsoluteFill } from "@storyboard/core";
import { staticFile, Video } from "@storyboard/media";

/**
 * Second shot — hard cut from b-roll, plays 5 seconds of the second clip.
 */
export default function ClipB() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video
        src={staticFile("assets/clips/second.mp4")}
        startFrom={0}
        endAt={5}
        muted={false}
        volume={1}
        objectFit="cover"
      />
    </AbsoluteFill>
  );
}
