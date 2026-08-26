import type { AudioClipDescriptor, VideoClipDescriptor } from "@levi-putna/storyboard-media";
import type { VideoManifest } from "@levi-putna/storyboard-schema";

export type StoryboardBridge = {
  version: 1;
  setFrame: (n: number) => void;
  getFrame: () => number;
  waitForReady: (timeoutMs?: number) => Promise<void>;
  collectAudioClips: () => AudioClipDescriptor[];
  collectVideoClips: () => VideoClipDescriptor[];
};

export type StoryboardWindow = Window & {
  __STORYBOARD__?: StoryboardBridge;
  __STORYBOARD_INPUT__?: {
    manifest: VideoManifest;
    formatId: string;
    initialFrame?: number;
  };
  __STORYBOARD_ASSET_BASE__?: string;
  __STORYBOARD_VIDEO_FRAMES__?: Record<
    string,
    { basePath: string; frameCount: number }
  >;
};
