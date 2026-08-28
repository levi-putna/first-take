import { AbsoluteFill } from "first-take";

/**
 * Second hold — amber field with a centred rounded square.
 */
export default function AmberSquare() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#d97706",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Centre rounded square */}
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: 36,
          backgroundColor: "#fcd34d",
          boxShadow: "0 0 0 12px rgba(255, 255, 255, 0.35)",
        }}
      />
    </AbsoluteFill>
  );
}
