/**
 * Fire-and-forget usage logging to /api/log (→ usage counters + Google Sheet). Never throws and never
 * blocks the UI; uses sendBeacon so the request survives the page opening LINE.
 */
export type LogEvent =
  | { kind: "view"; topicId: string }
  | { kind: "helpful" | "unhelpful"; topicId: string }
  | { kind: "visit" }
  | {
      kind: "report";
      channel: "line" | "copy";
      report: Record<string, string>;
      /** The topic the report was started from (/report?topic=…). */
      topicId?: string;
    };

export function logEvent(event: LogEvent): void {
  try {
    const body = JSON.stringify(event);
    if (typeof navigator !== "undefined" && navigator.sendBeacon?.("/api/log", body)) return;
    void fetch("/api/log", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // Logging is best-effort.
  }
}

const viewedThisVisit = new Set<string>();

/** Logs a topic view once per topic per page visit (re-opening the same card doesn't recount). */
export function logTopicView(topicId: string): void {
  if (viewedThisVisit.has(topicId)) return;
  viewedThisVisit.add(topicId);
  logEvent({ kind: "view", topicId });
}
