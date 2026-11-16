"use client";

import { useCallback } from "react";

export type CopyResult = "copied" | "blocked";

/**
 * Copy text to the clipboard. Returns "blocked" when the browser refuses,
 * so the UI can select the text for manual copying (spec edge case).
 */
export function useClipboard() {
  const copy = useCallback(async (text: string): Promise<CopyResult> => {
    try {
      if (!navigator.clipboard?.writeText) return "blocked";
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "blocked";
    }
  }, []);
  return { copy };
}
