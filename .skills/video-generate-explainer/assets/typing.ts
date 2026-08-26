/**
 * Frame-driven character-by-character typing for Remotion scenes.
 *
 * Default pace is ~35 characters per second (snappy product-demo feel).
 * Prefer that unless a scene needs typing stretched across a longer VO
 * beat - then pass `durationFrames` so characters still appear one at a
 * time, just slower.
 *
 * Copy this file into the production (or project) shared folder when a
 * scene types into a field:
 *   remotion/productions/{slug}/shared/typing.ts
 * or, once a second production needs it:
 *   remotion/shared/typing.ts
 *
 * Source of truth in the skill: assets/typing.ts
 * Guidance: references/natural-typing.md
 */

/** Frames between each character at 30fps. 30/35 ≈ 0.857 → ~35 chars/sec. */
export const FAST_FRAMES_PER_CHAR = 30 / 35;

type TypingPaceArgs = {
  text: string;
  frame: number;
  startFrame?: number;
  framesPerChar?: number;
};

type TypingDurationArgs = TypingPaceArgs & {
  durationFrames?: number;
};

/**
 * How many characters should be visible on this frame.
 */
export function typedCharCount({
  text,
  frame,
  startFrame = 0,
  framesPerChar = FAST_FRAMES_PER_CHAR,
}: TypingPaceArgs): number {
  if (frame < startFrame || !text) {
    return 0;
  }

  const elapsed = frame - startFrame;
  return Math.min(text.length, Math.floor(elapsed / framesPerChar));
}

/**
 * Visible typed substring for the current frame.
 */
export function typedText({
  text,
  frame,
  startFrame = 0,
  framesPerChar = FAST_FRAMES_PER_CHAR,
}: TypingPaceArgs): string {
  const count = typedCharCount({ text, frame, startFrame, framesPerChar });
  return text.slice(0, count);
}

/**
 * Type the full string evenly across a target duration (still one char at
 * a time - just paced to land when the VO needs it).
 */
export function typedTextOverDuration({
  text,
  frame,
  startFrame = 0,
  durationFrames,
}: {
  text: string;
  frame: number;
  startFrame?: number;
  durationFrames: number;
}): string {
  if (!text || durationFrames <= 0) {
    return "";
  }

  const framesPerChar = durationFrames / text.length;
  return typedText({ text, frame, startFrame, framesPerChar });
}

/**
 * Frame when the full string finishes typing.
 */
export function typingEndFrame({
  text,
  startFrame = 0,
  framesPerChar = FAST_FRAMES_PER_CHAR,
  durationFrames,
}: {
  text: string;
  startFrame?: number;
  framesPerChar?: number;
  durationFrames?: number;
}): number {
  if (durationFrames != null) {
    return startFrame + durationFrames;
  }

  return startFrame + Math.ceil(text.length * framesPerChar);
}

/**
 * True while characters are still appearing.
 */
export function isTyping({
  text,
  frame,
  startFrame = 0,
  framesPerChar = FAST_FRAMES_PER_CHAR,
  durationFrames,
}: TypingDurationArgs): boolean {
  const end = typingEndFrame({
    text,
    startFrame,
    framesPerChar,
    durationFrames,
  });

  return frame >= startFrame && frame < end;
}
