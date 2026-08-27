import type { ComponentType } from "react";
import {
  AbsoluteFill,
  SceneProvider,
  Sequence,
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
 * Compute sequence placements with gaps between clips.
 */
export function computeScenePlacements(scenes: Scene[]): Placement[] {
  const placements: Placement[] = [];
  let cursor = 0;
  for (const scene of scenes) {
    cursor += scene.gapBeforeFrames ?? 0;
    placements.push({
      scene,
      from: cursor,
      durationInFrames: scene.durationInFrames,
    });
    cursor += scene.durationInFrames;
  }
  return placements;
}

/**
 * Play scenes in order on one track. Fades and wipes belong in the scene components.
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
      {placements.map((placement) => {
        const Comp = components[placement.scene.component];
        if (!Comp) {
          throw new Error(
            `Missing component for path "${placement.scene.component}" (scene ${placement.scene.id})`,
          );
        }

        return (
          <Sequence
            key={placement.scene.id}
            from={placement.from}
            durationInFrames={placement.durationInFrames}
            name={placement.scene.title}
          >
            <SceneProvider sceneId={placement.scene.id}>
              <AbsoluteFill>
                <Comp {...(placement.scene.props ?? {})} />
              </AbsoluteFill>
            </SceneProvider>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
