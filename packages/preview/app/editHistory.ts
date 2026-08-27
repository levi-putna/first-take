import { useCallback, useState } from "react";
import type { VideoManifest } from "@levi-putna/storyboard-schema";
import { timelineStructureEqual } from "./timelineEdit";

/** In-memory studio state that can be undone or redone. */
export type StudioSnapshot = {
  workingManifest: VideoManifest;
  propOverrides: Record<string, Record<string, unknown>>;
};

export type EditHistoryState = {
  past: StudioSnapshot[];
  present: StudioSnapshot;
  future: StudioSnapshot[];
  lastCommitAt?: number;
};

export const MAX_HISTORY = 50;
export const COALESCE_MS = 500;

/**
 * Deep-clone a studio snapshot for the history stack.
 */
export function cloneSnapshot({ snapshot }: { snapshot: StudioSnapshot }): StudioSnapshot {
  return {
    workingManifest: structuredClone(snapshot.workingManifest),
    propOverrides: structuredClone(snapshot.propOverrides),
  };
}

/**
 * Compare prop override maps for equality.
 */
export function propOverridesEqual(
  left: Record<string, Record<string, unknown>>,
  right: Record<string, Record<string, unknown>>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    const leftProps = left[key];
    const rightProps = right[key];
    if (!rightProps) return false;
    const propKeys = Object.keys(leftProps);
    if (propKeys.length !== Object.keys(rightProps).length) return false;
    for (const propKey of propKeys) {
      if (!Object.is(leftProps[propKey], rightProps[propKey])) return false;
    }
  }
  return true;
}

/**
 * Compare two studio snapshots for undo no-op detection.
 */
export function studioSnapshotEqual({
  left,
  right,
}: {
  left: StudioSnapshot;
  right: StudioSnapshot;
}): boolean {
  if (left.workingManifest.title !== right.workingManifest.title) return false;
  if (
    !timelineStructureEqual({
      left: left.workingManifest,
      right: right.workingManifest,
    })
  ) {
    return false;
  }
  return propOverridesEqual(left.propOverrides, right.propOverrides);
}

/**
 * Push a committed snapshot onto the past stack.
 */
export function commitHistory({
  state,
  next,
  coalesce = false,
  now = Date.now(),
}: {
  state: EditHistoryState;
  next: StudioSnapshot;
  coalesce?: boolean;
  now?: number;
}): EditHistoryState {
  if (studioSnapshotEqual({ left: state.present, right: next })) {
    return state;
  }

  if (
    coalesce &&
    state.lastCommitAt != null &&
    now - state.lastCommitAt < COALESCE_MS
  ) {
    return {
      past: state.past,
      present: cloneSnapshot({ snapshot: next }),
      future: [],
      lastCommitAt: now,
    };
  }

  const past = [...state.past, cloneSnapshot({ snapshot: state.present })];
  while (past.length > MAX_HISTORY) {
    past.shift();
  }

  return {
    past,
    present: cloneSnapshot({ snapshot: next }),
    future: [],
    lastCommitAt: now,
  };
}

/**
 * Step back one committed snapshot.
 */
export function undoHistory({
  state,
}: {
  state: EditHistoryState;
}): EditHistoryState | null {
  if (state.past.length === 0) return null;

  const previous = state.past[state.past.length - 1];
  const past = state.past.slice(0, -1);
  const future = [cloneSnapshot({ snapshot: state.present }), ...state.future];

  return {
    past,
    present: cloneSnapshot({ snapshot: previous }),
    future,
  };
}

/**
 * Step forward one undone snapshot.
 */
export function redoHistory({
  state,
}: {
  state: EditHistoryState;
}): EditHistoryState | null {
  if (state.future.length === 0) return null;

  const next = state.future[0];
  const future = state.future.slice(1);
  const past = [...state.past, cloneSnapshot({ snapshot: state.present })];
  while (past.length > MAX_HISTORY) {
    past.shift();
  }

  return {
    past,
    present: cloneSnapshot({ snapshot: next }),
    future,
  };
}

/**
 * Replace the history stack with a fresh baseline (HMR / project switch).
 */
export function resetHistory({
  snapshot,
}: {
  snapshot: StudioSnapshot;
}): EditHistoryState {
  return {
    past: [],
    present: cloneSnapshot({ snapshot }),
    future: [],
  };
}

/**
 * Undo/redo stack for unsaved studio edits.
 */
export function useEditHistory({
  initialSnapshot,
}: {
  initialSnapshot: StudioSnapshot;
}) {
  const [history, setHistory] = useState<EditHistoryState>(() =>
    resetHistory({ snapshot: initialSnapshot }),
  );

  const commit = useCallback(
    ({
      next,
      coalesce = false,
    }: {
      next: StudioSnapshot;
      coalesce?: boolean;
    }) => {
      setHistory((current) => commitHistory({ state: current, next, coalesce }));
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((current) => undoHistory({ state: current }) ?? current);
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => redoHistory({ state: current }) ?? current);
  }, []);

  const reset = useCallback(({ snapshot }: { snapshot: StudioSnapshot }) => {
    setHistory(resetHistory({ snapshot }));
  }, []);

  /**
   * Replace the present snapshot without touching undo/redo stacks (e.g. after save).
   */
  const replacePresent = useCallback(({ snapshot }: { snapshot: StudioSnapshot }) => {
    setHistory((current) => ({
      ...current,
      present: cloneSnapshot({ snapshot }),
    }));
  }, []);

  return {
    present: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    commit,
    undo,
    redo,
    reset,
    replacePresent,
  };
}
