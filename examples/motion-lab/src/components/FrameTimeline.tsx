import {
  AbsoluteFill,
  useAbsoluteFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";

const TIMELINE_HEIGHT = 48;

/**
 * Persistent bottom timeline showing absolute frame index and progress.
 * Include in every scene so fade overlaps still show consistent timing.
 */
export function FrameTimeline() {
  const absoluteFrame = useAbsoluteFrame();
  const { durationInFrames, fps, width } = useVideoConfig();
  const progress =
    durationInFrames <= 1 ? 1 : absoluteFrame / (durationInFrames - 1);
  const seconds = (absoluteFrame / fps).toFixed(2);
  const totalSeconds = ((durationInFrames - 1) / fps).toFixed(2);
  const tickEvery = Math.max(15, Math.round(fps / 2));

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      {/* Timeline strip */}
      <div
        style={{
          height: TIMELINE_HEIGHT,
          width: "100%",
          backgroundColor: "rgba(6, 10, 18, 0.92)",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: `0 ${Math.round(width * 0.03)}px`,
          gap: 6,
          boxSizing: "border-box",
        }}
      >
        {/* Frame readout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            color: "#c9d4e8",
            letterSpacing: "0.02em",
          }}
        >
          <span>
            frame {String(absoluteFrame).padStart(4, "0")} / {durationInFrames - 1}
          </span>
          <span>
            {seconds}s / {totalSeconds}s @ {fps}fps
          </span>
        </div>

        {/* Progress track with ticks */}
        <div
          style={{
            position: "relative",
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
          }}
        >
          {/* Filled progress */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
              background:
                "linear-gradient(90deg, #3d8bfd 0%, #7dd3fc 100%)",
            }}
          />
          {/* Tick marks */}
          {Array.from({
            length: Math.floor((durationInFrames - 1) / tickEvery) + 1,
          }).map((_, i) => {
            const frame = i * tickEvery;
            const left = (frame / (durationInFrames - 1)) * 100;
            return (
              <div
                key={frame}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.28)",
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export { TIMELINE_HEIGHT };
