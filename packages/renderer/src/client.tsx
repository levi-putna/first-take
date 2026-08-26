import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useState } from "react";
import {
  StoryboardProvider,
  resetDelayRenderState,
  waitForRenderReady,
  type VideoConfig,
} from "@levi-putna/storyboard-core";
import { collectAudioClips, collectVideoClips } from "@levi-putna/storyboard-media";
import {
  totalDurationInFrames,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";
import {
  CompositionFromManifest,
  type ComponentMap,
} from "@levi-putna/storyboard-transitions";
import type { StoryboardBridge, StoryboardWindow } from "./types.js";

export type { StoryboardBridge } from "./types.js";

function App({
  manifest,
  components,
  formatId,
}: {
  manifest: VideoManifest;
  components: ComponentMap;
  formatId: string;
}) {
  const format =
    manifest.formats.find((f) => f.id === formatId) ?? manifest.formats[0];
  const durationInFrames = totalDurationInFrames(manifest);
  const w = window as unknown as StoryboardWindow;
  const [frame, setFrame] = useState(
    () => w.__STORYBOARD_INPUT__?.initialFrame ?? 0,
  );

  const config: VideoConfig = {
    id: `${manifest.slug}-${format.id}`,
    fps: manifest.fps,
    width: format.width,
    height: format.height,
    durationInFrames,
  };

  const setFrameSafe = useCallback((n: number) => {
    resetDelayRenderState();
    // Do not clear audio clips here — Audio re-registers synchronously on each render.
    setFrame(n);
  }, []);

  useEffect(() => {
    const bridge: StoryboardBridge = {
      version: 1,
      setFrame: setFrameSafe,
      getFrame: () => frame,
      waitForReady: async (timeoutMs = 15_000) => {
        await document.fonts.ready;
        await waitForRenderReady({ timeoutMs });
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      },
      collectAudioClips: () => collectAudioClips(),
      collectVideoClips: () => collectVideoClips(),
    };
    (window as unknown as StoryboardWindow).__STORYBOARD__ = bridge;
  }, [frame, setFrameSafe]);

  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        position: "relative",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <StoryboardProvider frame={frame} config={config}>
        <CompositionFromManifest manifest={manifest} components={components} />
      </StoryboardProvider>
    </div>
  );
}

/**
 * Mount the composition into #root for Playwright / preview.
 */
export function mountStoryboard({
  manifest,
  components,
  formatId,
}: {
  manifest: VideoManifest;
  components: ComponentMap;
  formatId: string;
}): void {
  const el = document.getElementById("root");
  if (!el) throw new Error("#root element missing");
  const root = createRoot(el);
  root.render(
    <App manifest={manifest} components={components} formatId={formatId} />,
  );
}
