"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const CHANGE_EVENT = "bgs-local-storage";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Browser-only persistence (Constitution V: reporter data never leaves the device).
 * Server render and storage failures (private mode, quota) fall back to `initial`.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  // Parse only when the stored string changes, so the returned value is referentially stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial is a default, read per raw value
  const value = useMemo(() => parse(raw, initial), [raw]);

  const write = useCallback(
    (next: string | null) => {
      try {
        if (next === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, next);
      } catch {
        /* storage unavailable: feature quietly degrades */
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  const set = useCallback((next: T) => write(JSON.stringify(next)), [write]);
  const remove = useCallback(() => write(null), [write]);

  return { value, set, remove };
}
