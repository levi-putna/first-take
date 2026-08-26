import type { ComponentType } from "react";
import { AbsoluteFill } from "@levi-putna/storyboard-core";
import type { VideoManifest } from "@levi-putna/storyboard-schema";
import { TransitionSeries, type ComponentMap } from "./TransitionSeries.js";

/**
 * Assemble a full video from a validated manifest and component map.
 * Tracks are stacked: index 0 paints on the bottom.
 */
export function CompositionFromManifest({
  manifest,
  components,
  scenePropOverrides,
}: {
  manifest: VideoManifest;
  components: ComponentMap;
  /** Live preview overrides keyed by scene id. */
  scenePropOverrides?: Record<string, Record<string, unknown>>;
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {manifest.tracks.map((track) => {
        const scenes = track.scenes.map((scene) => {
          const override = scenePropOverrides?.[scene.id];
          if (!override) return scene;
          return { ...scene, props: override };
        });
        return (
          <TransitionSeries
            key={track.id}
            scenes={scenes}
            components={components}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export type { ComponentType };
