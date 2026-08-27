import { useEffect, useMemo, useRef, useState } from "react";
import { listScenes, type VideoManifest } from "@levi-putna/storyboard-schema";
import {
  clipsFromSceneProps,
  mergeSceneAudioClips,
  normaliseAssetSrc,
  type SceneAudioClip,
} from "../src/scene-audio-parse";
import type { TimelineLane } from "./timelineModel";

type RegisteredAudioClip = {
  src: string;
  startFromFrame: number;
  loop: boolean;
  sceneId?: string;
  mediaStartSeconds?: number;
  mediaEndSeconds?: number;
};

/**
 * Read clips currently mounted in the composition (tagged with sceneId).
 */
function readRegisteredAudioClips(): RegisteredAudioClip[] {
  if (typeof window === "undefined") return [];
  const registry = (
    window as unknown as {
      __STORYBOARD_AUDIO__?: { clips: Map<string, RegisteredAudioClip> };
    }
  ).__STORYBOARD_AUDIO__;
  if (!registry) return [];
  return [...registry.clips.values()];
}

/**
 * Convert a live registry clip onto the scene that mounted it.
 */
function clipFromRegistry({
  clip,
  sceneStartFrame,
  isolated,
}: {
  clip: RegisteredAudioClip;
  sceneStartFrame: number;
  isolated: boolean;
}): SceneAudioClip {
  const startFromFrame = isolated
    ? clip.startFromFrame
    : Math.max(0, clip.startFromFrame - sceneStartFrame);
  return {
    src: normaliseAssetSrc({ src: clip.src }),
    loop: clip.loop,
    startFromFrame,
    mediaStartSeconds: clip.mediaStartSeconds,
    mediaEndSeconds: clip.mediaEndSeconds,
  };
}

/**
 * Detect per-scene audio from props, the preview API, and the live registry.
 */
export function useSceneAudio({
  manifest,
  lanes,
  isolated,
}: {
  manifest: VideoManifest;
  lanes: TimelineLane[];
  isolated: boolean;
}): Record<string, SceneAudioClip[]> {
  const [fromDisk, setFromDisk] = useState<Record<string, SceneAudioClip[]>>(
    {},
  );
  const [fromRegistry, setFromRegistry] = useState<
    Record<string, SceneAudioClip[]>
  >({});
  const registryCache = useRef<Record<string, SceneAudioClip[]>>({});
  const sceneStartById = useMemo(() => {
    const starts = new Map<string, number>();
    for (const lane of lanes) {
      for (const clip of lane.clips) {
        starts.set(clip.sceneId, clip.startFrame);
      }
    }
    return starts;
  }, [lanes]);

  const sceneKey = useMemo(
    () =>
      listScenes(manifest)
        .map(
          (scene) =>
            `${scene.id}:${scene.component}:${JSON.stringify(scene.props ?? {})}`,
        )
        .join("|"),
    [manifest],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/__storyboard/scene-audio")
      .then(async (response) => {
        if (!response.ok) return;
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) return;
        const payload = (await response.json()) as {
          scenes?: Record<string, SceneAudioClip[]>;
        };
        if (!cancelled && payload.scenes) setFromDisk(payload.scenes);
      })
      .catch(() => {
        // Studio may be on an older preview server without this endpoint.
      });
    return () => {
      cancelled = true;
    };
  }, [manifest.slug, sceneKey]);

  useEffect(() => {
    registryCache.current = {};
    setFromRegistry({});
  }, [manifest.slug]);

  useEffect(() => {
    /**
     * Keep audio seen on a scene even after Sequence unmounts it.
     */
    function harvest() {
      const next = { ...registryCache.current };
      let changed = false;
      for (const clip of readRegisteredAudioClips()) {
        if (!clip.sceneId) continue;
        const sceneStart = sceneStartById.get(clip.sceneId) ?? 0;
        const converted = clipFromRegistry({
          clip,
          sceneStartFrame: sceneStart,
          isolated,
        });
        const existing = next[clip.sceneId] ?? [];
        const merged = mergeSceneAudioClips({
          clips: [...existing, converted],
        });
        if (JSON.stringify(existing) !== JSON.stringify(merged)) {
          next[clip.sceneId] = merged;
          changed = true;
        }
      }
      if (!changed) return;
      registryCache.current = next;
      setFromRegistry(next);
    }

    harvest();
    const timer = window.setInterval(harvest, 750);
    return () => window.clearInterval(timer);
  }, [isolated, sceneStartById]);

  return useMemo(() => {
    const combined: Record<string, SceneAudioClip[]> = {};
    for (const scene of listScenes(manifest)) {
      combined[scene.id] = mergeSceneAudioClips({
        clips: [
          ...clipsFromSceneProps({ props: scene.props }),
          ...(fromDisk[scene.id] ?? []),
          ...(fromRegistry[scene.id] ?? []),
        ],
      });
    }
    return combined;
  }, [fromDisk, fromRegistry, manifest]);
}
