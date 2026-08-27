/**
 * Dense, normalised amplitude samples for one decoded audio file.
 */
export type FilePeaks = {
  peaks: number[];
  durationSeconds: number;
};

const PEAK_SAMPLE_COUNT = 2048;
const SILENCE_THRESHOLD = 0.02;

/**
 * Turn a source path or URL into a same-origin fetch URL.
 */
export function audioFetchUrl({ src }: { src: string }): string {
  if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
  return `/${src.replace(/^\.\//, "")}`;
}

/**
 * Sample a peak array at a time within the decoded file.
 */
export function sampleFilePeak({
  peaks,
  durationSeconds,
  timeSeconds,
}: {
  peaks: number[];
  durationSeconds: number;
  timeSeconds: number;
}): number {
  if (peaks.length === 0 || durationSeconds <= 0) return 0;
  if (timeSeconds < 0 || timeSeconds >= durationSeconds) return 0;
  const ratio = timeSeconds / durationSeconds;
  const index = Math.min(peaks.length - 1, Math.floor(ratio * peaks.length));
  return peaks[index] ?? 0;
}

/**
 * Map a decoded file onto a timeline clip as `barCount` amplitudes.
 */
export function peaksForTimelineClip({
  file,
  barCount,
  clipDurationSeconds,
  loop,
  startFromSeconds = 0,
  mediaStartSeconds,
  mediaEndSeconds,
}: {
  file: FilePeaks;
  barCount: number;
  clipDurationSeconds: number;
  loop: boolean;
  startFromSeconds?: number;
  mediaStartSeconds?: number;
  mediaEndSeconds?: number;
}): number[] {
  const usableStart = mediaStartSeconds ?? 0;
  const usableEnd = mediaEndSeconds ?? file.durationSeconds;
  const usableDuration = Math.max(0.001, usableEnd - usableStart);
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const t = ((i + 0.5) / Math.max(1, barCount)) * clipDurationSeconds;
    const sourceTime = t - startFromSeconds;
    if (sourceTime < 0) {
      bars.push(0);
      continue;
    }
    let intoFile = sourceTime;
    if (loop) {
      intoFile = intoFile % usableDuration;
    } else if (intoFile >= usableDuration) {
      bars.push(0);
      continue;
    }
    bars.push(
      sampleFilePeak({
        peaks: file.peaks,
        durationSeconds: file.durationSeconds,
        timeSeconds: usableStart + intoFile,
      }),
    );
  }
  return bars;
}

/**
 * Combine overlapping sources with a per-bar maximum.
 */
export function mixPeakBars({ groups }: { groups: number[][] }): number[] {
  const count = groups[0]?.length ?? 0;
  const mixed = new Array<number>(count).fill(0);
  for (const group of groups) {
    for (let i = 0; i < count; i++) {
      mixed[i] = Math.max(mixed[i] ?? 0, group[i] ?? 0);
    }
  }
  return mixed;
}

/**
 * Downsample a mono PCM buffer to a compact peak envelope.
 */
export function downsamplePeaks({
  channel,
  count = PEAK_SAMPLE_COUNT,
}: {
  channel: Float32Array;
  count?: number;
}): number[] {
  if (channel.length === 0 || count <= 0) return [];
  const block = Math.max(1, Math.floor(channel.length / count));
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = i * block;
    const end = Math.min(channel.length, start + block);
    let max = 0;
    for (let j = start; j < end; j++) {
      const value = Math.abs(channel[j] ?? 0);
      if (value > max) max = value;
    }
    peaks.push(max);
  }
  const peak = Math.max(...peaks, 0.0001);
  return peaks.map((value) => Math.round((value / peak) * 1000) / 1000);
}

/**
 * Mix every channel down to mono.
 */
export function mixToMono({ buffer }: { buffer: AudioBuffer }): Float32Array {
  const length = buffer.length;
  const mixed = new Float32Array(length);
  const channels = buffer.numberOfChannels;
  if (channels === 0) return mixed;
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      mixed[i] += (data[i] ?? 0) / channels;
    }
  }
  return mixed;
}

let audioContext: AudioContext | null = null;
const filePeakCache = new Map<string, Promise<FilePeaks | null>>();

/**
 * Shared AudioContext for decoding studio assets.
 */
function getAudioContext(): AudioContext {
  if (audioContext) return audioContext;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) {
    throw new Error("Web Audio is not available");
  }
  audioContext = new Ctor();
  return audioContext;
}

/**
 * Decode a media URL into a cached peak envelope, or null when silent/unreadable.
 */
export function loadFilePeaks({ src }: { src: string }): Promise<FilePeaks | null> {
  const url = audioFetchUrl({ src });
  const cached = filePeakCache.get(url);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    const context = getAudioContext();
    const buffer = await context.decodeAudioData(bytes.slice(0));
    const peaks = downsamplePeaks({ channel: mixToMono({ buffer }) });
    const loudest = peaks.reduce((max, value) => Math.max(max, value), 0);
    if (loudest < SILENCE_THRESHOLD) return null;
    return { peaks, durationSeconds: buffer.duration };
  })().catch(() => null);

  filePeakCache.set(url, pending);
  return pending;
}
