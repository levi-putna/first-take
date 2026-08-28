import { interpolate, useCurrentFrame, useVideoConfig } from "first-take";
import { SceneShell, useCrossfadeOpacity } from "../components/SceneShell";

/**
 * Two boxes drifting on gentle Lissajous-style paths.
 */
export default function FloatingBoxesScene() {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const layerOpacity = useCrossfadeOpacity();
  const t = frame / fps;

  const boxSize = Math.round(Math.min(width, height) * 0.14);
  const padX = width * 0.12;
  const padY = height * 0.12;
  const travelX = width - padX * 2 - boxSize;
  const travelY = height - padY * 2 - boxSize - 48;

  const aX =
    padX +
    (0.5 + 0.5 * Math.sin(t * 0.9)) * travelX;
  const aY =
    padY +
    (0.5 + 0.5 * Math.sin(t * 0.7 + 0.4)) * travelY;
  const bX =
    padX +
    (0.5 + 0.5 * Math.sin(t * 0.75 + 1.2)) * travelX;
  const bY =
    padY +
    (0.5 + 0.5 * Math.cos(t * 0.95 + 0.2)) * travelY;

  const intro = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell contentStyle={{ position: "relative" }} opacity={layerOpacity}>
      {/* Scene label */}
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 14,
          color: "#7dd3fc",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: intro,
        }}
      >
        02 — Floating boxes
      </div>

      {/* Box A */}
      <div
        style={{
          position: "absolute",
          left: aX,
          top: aY,
          width: boxSize,
          height: boxSize,
          borderRadius: 18,
          background: "linear-gradient(145deg, #3d8bfd, #1e3a5f)",
          opacity: intro,
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        }}
      />

      {/* Box B */}
      <div
        style={{
          position: "absolute",
          left: bX,
          top: bY,
          width: boxSize * 0.85,
          height: boxSize * 0.85,
          borderRadius: 18,
          background: "linear-gradient(145deg, #f0b429, #b45309)",
          opacity: intro,
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        }}
      />
    </SceneShell>
  );
}
