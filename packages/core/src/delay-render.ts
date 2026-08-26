type DelayHandle = {
  id: number;
  label: string;
};

type DelayState = {
  nextId: number;
  pending: Map<number, DelayHandle>;
  cancelled: Error | null;
  waiters: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
  }>;
};

const state: DelayState = {
  nextId: 1,
  pending: new Map(),
  cancelled: null,
  waiters: [],
};

function notifyReady() {
  if (state.pending.size === 0 && !state.cancelled) {
    const waiters = state.waiters.splice(0);
    for (const w of waiters) w.resolve();
  }
}

/**
 * Pause frame capture until continueRender(handle) is called.
 * No-op effect in preview beyond tracking readiness.
 */
export function delayRender(label = "delayRender"): number {
  const id = state.nextId++;
  state.pending.set(id, { id, label });
  return id;
}

/**
 * Clear a delayRender handle so capture can proceed.
 */
export function continueRender(handle: number): void {
  state.pending.delete(handle);
  notifyReady();
}

/**
 * Fail the current frame render with an error.
 */
export function cancelRender(error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  state.cancelled = err;
  const waiters = state.waiters.splice(0);
  for (const w of waiters) w.reject(err);
}

/**
 * Whether any delay handles are still open.
 */
export function isRenderReady(): boolean {
  return state.pending.size === 0 && state.cancelled === null;
}

/**
 * Wait until all delayRender handles are cleared (or reject on cancel).
 */
export function waitForRenderReady({
  timeoutMs = 15_000,
}: {
  timeoutMs?: number;
} = {}): Promise<void> {
  if (state.cancelled) {
    return Promise.reject(state.cancelled);
  }
  if (state.pending.size === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const labels = [...state.pending.values()].map((h) => h.label).join(", ");
      reject(
        new Error(
          `delayRender timed out after ${timeoutMs}ms. Pending: ${labels || "(none)"}`,
        ),
      );
    }, timeoutMs);

    state.waiters.push({
      resolve: () => {
        clearTimeout(timer);
        resolve();
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });
  });
}

/**
 * Reset delay state between frames (called by the renderer client).
 */
export function resetDelayRenderState(): void {
  state.pending.clear();
  state.cancelled = null;
  state.waiters = [];
}

/**
 * List pending delay labels (debug).
 */
export function getPendingDelayLabels(): string[] {
  return [...state.pending.values()].map((h) => h.label);
}
