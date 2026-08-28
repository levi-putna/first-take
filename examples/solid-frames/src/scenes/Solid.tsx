import { AbsoluteFill, useCurrentFrame } from "first-take";

/**
 * Solid colour that steps every 15 frames for deterministic golden stills.
 */
export default function Solid() {
  const frame = useCurrentFrame();
  // Frame 0–14 red, 15–29 blue
  const backgroundColor = frame < 15 ? "#ff0000" : "#0000ff";

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
      }}
    />
  );
}
