import {
  contentDurationInFrames,
  leadInFrames,
  sceneStartFrames,
  totalDurationInFrames,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";

export type TimelineSegment = {
  key: string;
  kind: "lead-in" | "scene" | "tail";
  title: string;
  startFrame: number;
  durationInFrames: number;
  audioStartSeconds?: number;
  audioEndSeconds?: number;
  narration?: string;
};

/**
 * Flatten lead-in, scenes, and tail into timeline clips.
 */
export function timelineSegments({
  manifest,
}: {
  manifest: VideoManifest;
}): TimelineSegment[] {
  const lead = leadInFrames(manifest);
  const starts = sceneStartFrames(manifest);
  const total = totalDurationInFrames(manifest);
  const content = contentDurationInFrames(manifest);
  const segments: TimelineSegment[] = [];

  if (lead > 0) {
    segments.push({
      key: "lead-in",
      kind: "lead-in",
      title: "Lead-in",
      startFrame: 0,
      durationInFrames: lead,
    });
  }

  manifest.scenes.forEach((scene, index) => {
    segments.push({
      key: scene.id,
      kind: "scene",
      title: scene.title,
      startFrame: starts[index] ?? 0,
      durationInFrames: scene.durationInFrames,
      audioStartSeconds: scene.audioStartSeconds,
      audioEndSeconds: scene.audioEndSeconds,
      narration: scene.narration,
    });
  });

  const tail = total - (lead + content);
  if (tail > 0) {
    segments.push({
      key: "tail",
      kind: "tail",
      title: "Tail",
      startFrame: total - tail,
      durationInFrames: tail,
    });
  }

  return segments;
}

/**
 * Segment under the playhead. During a fade, prefers the incoming clip.
 */
export function segmentAtFrame({
  segments,
  frame,
}: {
  segments: TimelineSegment[];
  frame: number;
}): TimelineSegment | undefined {
  const covering = segments.filter(
    (segment) =>
      frame >= segment.startFrame &&
      frame < segment.startFrame + segment.durationInFrames,
  );
  if (covering.length > 0) return covering[covering.length - 1];
  return segments[segments.length - 1];
}
