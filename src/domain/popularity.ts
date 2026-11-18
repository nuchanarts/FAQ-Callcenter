import type { EffectiveTopic } from "@/domain/topics";

/** Below this many views a count looks empty rather than encouraging, so it isn't shown. */
export const VIEW_COUNT_MIN = 5;
/** How many topics get the "ยอดนิยม" badge. */
export const POPULAR_BADGE_LIMIT = 5;
/** How many topics the "ปัญหาที่พบบ่อย" strip shows. */
export const FREQUENT_STRIP_LIMIT = 3;

/**
 * The most-viewed of the listed topics (≥ VIEW_COUNT_MIN views), most first; ties keep the
 * list order. Counts for topics not in `topics` (deleted, hidden) are ignored.
 */
export function rankPopular(
  topics: EffectiveTopic[],
  counts: Record<string, number>,
  limit: number,
): EffectiveTopic[] {
  return topics
    .map((topic, index) => ({ topic, index, views: counts[topic.id] ?? 0 }))
    .filter((x) => x.views >= VIEW_COUNT_MIN)
    .sort((a, b) => b.views - a.views || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.topic);
}
