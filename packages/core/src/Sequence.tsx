import type { CSSProperties, ReactNode } from "react";
import {
  FrameOffsetProvider,
  useAbsoluteFrame,
  useCurrentFrame,
  useSequenceDuration,
} from "./context.js";

export type SequenceProps = {
  from?: number;
  durationInFrames?: number;
  layout?: "absolute-fill" | "none";
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
  /** Name for timeline debugging (preview only). */
  name?: string;
};

/**
 * Time-shift children so useCurrentFrame() is relative to `from`
 * within the parent timeline (nested Sequences nest correctly).
 */
export function Sequence({
  from = 0,
  durationInFrames,
  layout = "absolute-fill",
  style,
  className,
  children,
}: SequenceProps) {
  const parentFrame = useCurrentFrame();
  const absoluteFrame = useAbsoluteFrame();
  const parentDuration = useSequenceDuration();
  const localFrame = parentFrame - from;
  const remainingParent =
    parentDuration === undefined
      ? undefined
      : Math.max(0, parentDuration - from);
  const sequenceDurationInFrames = durationInFrames ?? remainingParent;

  const inRange =
    localFrame >= 0 &&
    (durationInFrames === undefined || localFrame < durationInFrames);

  if (!inRange) {
    return null;
  }

  const content = (
    <FrameOffsetProvider
      absoluteFrame={absoluteFrame}
      localFrame={localFrame}
      sequenceDurationInFrames={sequenceDurationInFrames}
    >
      {children}
    </FrameOffsetProvider>
  );

  if (layout === "none") {
    return content;
  }

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      {content}
    </div>
  );
}
