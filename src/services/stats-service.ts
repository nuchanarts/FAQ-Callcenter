import { bangkokDay, sinceDay, type StatsRange, type UsageKind } from "@/domain/usage";
import type { StatsRepository } from "@/repositories/types";

/** Public view counts are read on every home page render; cache them briefly per instance. */
export const VIEW_COUNTS_TTL_MS = 60_000;

export interface ViewCountCache {
  current: { at: number; counts: Record<string, number> } | null;
}

export interface TopicStats {
  views: number;
  reports: number;
  helpful: number;
  unhelpful: number;
}

export interface AdminStats {
  visits: number;
  views: number;
  /** All reports, including ones not started from a topic. */
  reports: number;
  byTopic: Record<string, TopicStats>;
  /** true = the counters could not be read (numbers are zeros). */
  degraded: boolean;
}

const EMPTY_TOPIC: TopicStats = { views: 0, reports: 0, helpful: 0, unhelpful: 0 };
const TOPIC_FIELD = {
  view: "views",
  report: "reports",
  helpful: "helpful",
  unhelpful: "unhelpful",
} as const;

/**
 * Usage statistics. Counting and reading are best-effort: a broken store is logged and
 * never reaches the page or the report flow.
 */
export function createStatsService(deps: {
  stats: StatsRepository;
  now: () => Date;
  cache: ViewCountCache;
}) {
  const { stats, now, cache } = deps;

  async function record(kind: UsageKind, topicId = ""): Promise<void> {
    try {
      await stats.increment({ kind, topicId, day: bangkokDay(now()) });
    } catch (err) {
      console.error("[stats] record:", err instanceof Error ? err.message : err);
    }
  }

  async function getViewCounts(): Promise<Record<string, number>> {
    const at = now().getTime();
    if (cache.current && at - cache.current.at < VIEW_COUNTS_TTL_MS) return cache.current.counts;
    try {
      const counts: Record<string, number> = {};
      for (const r of await stats.list(null)) {
        if (r.kind === "view" && r.topicId) counts[r.topicId] = (counts[r.topicId] ?? 0) + r.count;
      }
      cache.current = { at, counts };
      return counts;
    } catch (err) {
      console.error("[stats] view counts:", err instanceof Error ? err.message : err);
      // Keep serving the last good counts, and don't hit a failing (possibly slow) store
      // again for a whole TTL: the home page must never wait on it render after render.
      const counts = cache.current?.counts ?? {};
      cache.current = { at, counts };
      return counts;
    }
  }

  async function getAdminStats(range: StatsRange): Promise<AdminStats> {
    const result: AdminStats = { visits: 0, views: 0, reports: 0, byTopic: {}, degraded: false };
    let rows;
    try {
      rows = await stats.list(sinceDay(range, bangkokDay(now())));
    } catch (err) {
      console.error("[stats] admin stats:", err instanceof Error ? err.message : err);
      return { ...result, degraded: true };
    }
    for (const r of rows) {
      if (r.kind === "visit") result.visits += r.count;
      if (r.kind === "view") result.views += r.count;
      if (r.kind === "report") result.reports += r.count;
      if (r.kind !== "visit" && r.topicId) {
        const t = (result.byTopic[r.topicId] ??= { ...EMPTY_TOPIC });
        t[TOPIC_FIELD[r.kind]] += r.count;
      }
    }
    return result;
  }

  return { record, getViewCounts, getAdminStats };
}
