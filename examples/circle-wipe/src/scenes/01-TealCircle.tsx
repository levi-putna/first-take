import { AbsoluteFill } from "@levi-putna/storyboard-core";

/**
 * First hold — teal field with a centred circle motif.
 */
export default function TealCircle() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d9488",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Centre circle */}
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          backgroundColor: "#5eead4",
          boxShadow: "0 0 0 12px rgba(255, 255, 255, 0.35)",
        }}
      />
    </AbsoluteFill>
  );
}
