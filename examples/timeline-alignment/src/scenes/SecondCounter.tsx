import {
  AbsoluteFill,
  useAbsoluteFrame,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { formatClock } from "../formatClock";

/**
 * Transparent one-second overlay that shows elapsed time from composition start.
 * Declared `second` should match `floor(absoluteFrame / fps)` when the timeline is aligned.
 */
export default function SecondCounter({ second = 0 }: { second?: number }) {
  const frame = useCurrentFrame();
  const absoluteFrame = useAbsoluteFrame();
  const { fps, width, height } = useVideoConfig();
  const absoluteSecond = Math.floor(absoluteFrame / fps);
  const aligned = absoluteSecond === second;
  const clock = formatClock({ totalSeconds: second });
  const absoluteClock = formatClock({ totalSeconds: absoluteSecond });
  const secondProgress = fps <= 0 ? 1 : frame / (fps - 1);

  return (
    <AbsoluteFill>
      {/* Elapsed-second clock */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textShadow: "0 4px 18px rgba(0, 0, 0, 0.65)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: Math.max(64, width * 0.16),
            fontWeight: 700,
            letterSpacing: "0.06em",
            lineHeight: 1,
            outline: aligned ? "none" : "6px solid #ff3b3b",
            outlineOffset: 12,
            borderRadius: 8,
            padding: "0 12px",
          }}
        >
          {clock}
        </div>

        {/* Declared second vs absolute composition second */}
        <div
          style={{
            marginTop: height * 0.04,
            fontSize: Math.max(16, width * 0.022),
            letterSpacing: "0.04em",
            opacity: 0.92,
          }}
        >
          second {String(second).padStart(3, "0")} · abs {absoluteClock}
        </div>

        {!aligned ? (
          <div
            style={{
              marginTop: 12,
              padding: "6px 14px",
              borderRadius: 999,
              background: "#ff3b3b",
              fontSize: Math.max(14, width * 0.016),
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Timeline mismatch
          </div>
        ) : null}
      </div>

      {/* Intra-second progress — local frame 0 to fps-1 */}
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          right: width * 0.08,
          bottom: height * 0.04,
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.22)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(1, Math.max(0, secondProgress)) * 100}%`,
            backgroundColor: "#ffffff",
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
