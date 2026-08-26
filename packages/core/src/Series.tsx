import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Sequence, type SequenceProps } from "./Sequence.js";

type SeriesSequenceProps = SequenceProps & {
  durationInFrames: number;
  offset?: number;
};

/**
 * Marker component for Series children (rendered as Sequence with computed from).
 */
function SeriesSequence(_props: SeriesSequenceProps): null {
  // Actual rendering is done by parent Series
  return null;
}

/**
 * Stitch sequences back-to-back. MVP: sequential only (no negative offset overlaps).
 */
export function Series({ children }: { children: ReactNode }) {
  const items: ReactElement<SeriesSequenceProps>[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type !== SeriesSequence) {
      throw new Error("Series children must be Series.Sequence elements");
    }
    items.push(child as ReactElement<SeriesSequenceProps>);
  });

  let cursor = 0;
  return (
    <>
      {items.map((item, index) => {
        const offset = item.props.offset ?? 0;
        cursor += offset;
        const from = cursor;
        const duration = item.props.durationInFrames;
        cursor += duration;
        return (
          <Sequence
            key={item.key ?? index}
            from={from}
            durationInFrames={duration}
            layout={item.props.layout ?? "absolute-fill"}
            style={item.props.style}
            className={item.props.className}
            name={item.props.name}
          >
            {item.props.children}
          </Sequence>
        );
      })}
    </>
  );
}

Series.Sequence = SeriesSequence;
