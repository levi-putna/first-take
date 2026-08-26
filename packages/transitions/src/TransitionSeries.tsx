import type { ComponentType } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "@levi-putna/storyboard-core";
import {
  sequentialOverlapFrames,
  type Scene,
} from "@levi-putna/storyboard-schema";

export type ComponentMap = Record<string, ComponentType<Record<string, unknown>>>;

type Placement = {
  scene: Scene;
  /** Global-from within the TransitionSeries (starts at 0). */
  from: number;
  durationInFrames: number;
};

/**
 * Compute sequence placements with gaps and sequential fade overlaps.
 */
export function computeScenePlacements(scenes: Scene[]): Placement[] {
  const placements: Placement[] = [];
  let cursor = 0;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    cursor += scene.gapBeforeFrames ?? 0;
    cursor -= sequentialOverlapFrames({ scene, index: i });
    placements.push({
      scene,
      from: cursor,
      durationInFrames: scene.durationInFrames,
    });
    cursor += scene.durationInFrames;
  }
  return placements;
}

function FadeScene({
  scene,
  Component,
  overlapIn,
  overlapOut,
}: {
  scene: Scene;
  Component: ComponentType<Record<string, unknown>>;
  overlapIn: number;
  overlapOut: number;
}) {
  const frame = useCurrentFrame();
  const duration = scene.durationInFrames;

  let opacity = 1;
  if (overlapIn > 0) {
    opacity *= interpolate(frame, [0, overlapIn], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  if (overlapOut > 0) {
    opacity *= interpolate(
      frame,
      [duration - overlapOut, duration],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <Component {...(scene.props ?? {})} />
    </AbsoluteFill>
  );
}

/**
 * Play scenes in order with optional fade overlaps and gaps between them.
 */
export function TransitionSeries({
  scenes,
  components,
}: {
  scenes: Scene[];
  components: ComponentMap;
}) {
  const placements = computeScenePlacements(scenes);

  return (
    <AbsoluteFill>
      {placements.map((placement, index) => {
        const Comp = components[placement.scene.component];
        if (!Comp) {
          throw new Error(
            `Missing component for path "${placement.scene.component}" (scene ${placement.scene.id})`,
          );
        }
        const overlapIn =
          placement.scene.transitionIn?.type === "fade"
            ? (placement.scene.transitionIn.durationInFrames ?? 0)
            : 0;
        const next = scenes[index + 1];
        const overlapOut =
          next?.transitionIn?.type === "fade"
            ? sequentialOverlapFrames({ scene: next, index: index + 1 })
            : 0;

        return (
          <Sequence
            key={placement.scene.id}
            from={placement.from}
            durationInFrames={placement.durationInFrames}
            name={placement.scene.title}
          >
            <FadeScene
              scene={placement.scene}
              Component={Comp}
              overlapIn={overlapIn}
              overlapOut={overlapOut}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
