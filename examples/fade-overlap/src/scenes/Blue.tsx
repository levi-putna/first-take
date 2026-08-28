import { AbsoluteFill, interpolate, useCurrentFrame } from "first-take";

/**
 * Solid blue scene — fades in over the red hold on a higher track.
 */
export default function Blue() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0000ff", opacity }} />
  );
}
