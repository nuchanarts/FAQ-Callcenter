"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Live CSS media query match.
 * - `null` during the server render and hydration (screen size unknown) — callers let CSS
 *   decide the layout then, so there is no layout shift.
 * - `false` when matchMedia is unavailable or the query does not match.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => null,
  );
}

/** Breakpoint where the home screen shows the topic list and the answer side by side. */
export const WIDE_SCREEN_QUERY = "(min-width: 1280px)";
