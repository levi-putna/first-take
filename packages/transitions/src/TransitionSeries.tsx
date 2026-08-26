import type { ComponentType } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "@levi-putna/storyboard-core";
import type { Scene } from "@levi-putna/storyboard-schema";

export type ComponentMap = Record<string, ComponentType<Record<string, unknown>>>;

type Placement = {
  scene: Scene;
  /** Global-from within the TransitionSeries (starts at 0). */
  from: number;
  durationInFrames: number;
};

/**
 * Compute sequence placements with transition overlaps (same math as schema content duration).
 */
export function computeScenePlacements(scenes: Scene[]): Placement[] {
  const placements: Placement[] = [];
  let cursor = 0;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const overlap = i === 0 ? 0 : (scene.transitionIn?.durationInFrames ?? 0);
    cursor -= overlap;
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
 * Play scenes in order with optional fade overlaps between them.
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
          index === 0 ? 0 : (placement.scene.transitionIn?.durationInFrames ?? 0);
        const next = scenes[index + 1];
        const overlapOut = next?.transitionIn?.durationInFrames ?? 0;

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
              overlapIn={
                placement.scene.transitionIn?.type === "fade" ? overlapIn : 0
              }
              overlapOut={
                next?.transitionIn?.type === "fade" ? overlapOut : 0
              }
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
