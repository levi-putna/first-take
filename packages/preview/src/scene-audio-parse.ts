const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
const MEDIA_EXT = /\.(mp3|wav|m4a|aac|ogg|mp4|webm|mov)$/i;

export type SceneAudioClip = {
  src: string;
  loop: boolean;
  /** Scene-local frame where this source begins. */
  startFromFrame?: number;
  mediaStartSeconds?: number;
  mediaEndSeconds?: number;
};

/**
 * Strip a leading ./ or / so asset paths match staticFile URLs.
 */
export function normaliseAssetSrc({ src }: { src: string }): string {
  return src.replace(/^\.\//, "").replace(/^\/+/, "");
}

/**
 * Recursively collect string values that look like audio file paths.
 */
export function collectAudioPathsFromValue({
  value,
}: {
  value: unknown;
}): string[] {
  const out: string[] = [];
  collectAudioPaths({ value, out });
  return [...new Set(out.map((src) => normaliseAssetSrc({ src })))];
}

/**
 * Walk JSON-like values for audio file strings.
 */
function collectAudioPaths({
  value,
  out,
}: {
  value: unknown;
  out: string[];
}): void {
  if (typeof value === "string") {
    if (AUDIO_EXT.test(value)) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAudioPaths({ value: item, out });
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectAudioPaths({ value: item, out });
    }
  }
}

/**
 * Audio files declared on scene props (jingle, bed, narration, …).
 */
export function clipsFromSceneProps({
  props,
}: {
  props?: Record<string, unknown>;
}): SceneAudioClip[] {
  return collectAudioPathsFromValue({ value: props }).map((src) => ({
    src,
    loop: false,
  }));
}

/**
 * Merge clips that share a source, keeping loop/trim when either side has them.
 */
export function mergeSceneAudioClips({
  clips,
}: {
  clips: SceneAudioClip[];
}): SceneAudioClip[] {
  const bySrc = new Map<string, SceneAudioClip>();
  for (const clip of clips) {
    const src = normaliseAssetSrc({ src: clip.src });
    const current = bySrc.get(src);
    if (!current) {
      bySrc.set(src, { ...clip, src });
      continue;
    }
    bySrc.set(src, {
      src,
      loop: current.loop || clip.loop,
      startFromFrame: clip.startFromFrame ?? current.startFromFrame,
      mediaStartSeconds: clip.mediaStartSeconds ?? current.mediaStartSeconds,
      mediaEndSeconds: clip.mediaEndSeconds ?? current.mediaEndSeconds,
    });
  }
  return [...bySrc.values()];
}

/**
 * JSX attribute blobs for self-closing tags such as <Audio /> and <Video />.
 */
export function extractJsxAttributeBlocks({
  source,
  tag,
}: {
  source: string;
  tag: string;
}): string[] {
  const pattern = new RegExp(`<${tag}\\b([\\s\\S]*?)/>`, "g");
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    blocks.push(match[1] ?? "");
  }
  return blocks;
}

/**
 * Read a boolean JSX attribute, treating a bare name as true.
 */
export function readBooleanAttr({
  jsx,
  name,
}: {
  jsx: string;
  name: string;
}): boolean {
  if (new RegExp(`${name}\\s*=\\s*\\{\\s*false\\s*\\}`).test(jsx)) return false;
  if (new RegExp(`${name}\\s*=\\s*\\{\\s*true\\s*\\}`).test(jsx)) return true;
  return new RegExp(`\\b${name}\\b`).test(jsx);
}

/**
 * Read a numeric JSX expression, or a prop of the same name.
 */
export function readNumericAttr({
  jsx,
  name,
  props,
}: {
  jsx: string;
  name: string;
  props?: Record<string, unknown>;
}): number | undefined {
  const literal = new RegExp(`${name}\\s*=\\s*\\{\\s*([0-9.]+)\\s*\\}`).exec(
    jsx,
  );
  if (literal?.[1]) return Number(literal[1]);
  const ident = new RegExp(
    `${name}\\s*=\\s*\\{\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\}`,
  ).exec(jsx);
  if (!ident?.[1] || !props) return undefined;
  const value = props[ident[1]];
  return typeof value === "number" ? value : undefined;
}

/**
 * Resolve staticFile("path"), staticFile(prop), or src="path" to media paths.
 */
export function readSrcPaths({
  jsx,
  props,
}: {
  jsx: string;
  props?: Record<string, unknown>;
}): string[] {
  const srcs: string[] = [];
  const quotedFile = /staticFile\(\s*["']([^"']+)["']\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = quotedFile.exec(jsx))) {
    if (match[1]) srcs.push(match[1]);
  }
  const identFile = /staticFile\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g;
  while ((match = identFile.exec(jsx))) {
    const value = props?.[match[1] ?? ""];
    if (typeof value === "string") srcs.push(value);
  }
  const quotedSrc = /src\s*=\s*["']([^"']+)["']/.exec(jsx);
  if (quotedSrc?.[1]) srcs.push(quotedSrc[1]);
  return srcs
    .filter((src) => MEDIA_EXT.test(src))
    .map((src) => normaliseAssetSrc({ src }));
}

/**
 * Detect <Audio> / unmuted <Video> sources in a scene component.
 */
export function clipsFromComponentSource({
  source,
  props,
}: {
  source: string;
  props?: Record<string, unknown>;
}): SceneAudioClip[] {
  const clips: SceneAudioClip[] = [];

  for (const jsx of extractJsxAttributeBlocks({ source, tag: "Audio" })) {
    const srcs = readSrcPaths({ jsx, props });
    const loop = readBooleanAttr({ jsx, name: "loop" });
    const startFromFrame = readNumericAttr({
      jsx,
      name: "startFromFrame",
      props,
    });
    for (const src of srcs) {
      if (!AUDIO_EXT.test(src) && !VIDEO_EXT.test(src)) continue;
      clips.push({
        src,
        loop,
        startFromFrame,
      });
    }
  }

  for (const jsx of extractJsxAttributeBlocks({ source, tag: "Video" })) {
    if (readBooleanAttr({ jsx, name: "muted" })) continue;
    const srcs = readSrcPaths({ jsx, props });
    const mediaStartSeconds = readNumericAttr({
      jsx,
      name: "startFrom",
      props,
    });
    const mediaEndSeconds = readNumericAttr({ jsx, name: "endAt", props });
    for (const src of srcs) {
      clips.push({
        src,
        loop: false,
        mediaStartSeconds,
        mediaEndSeconds,
      });
    }
  }

  return clips;
}
