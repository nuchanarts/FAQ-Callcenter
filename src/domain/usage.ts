/**
 * Usage counters: how often topics are viewed, reported, rated, and how often the site is
 * visited — counted per Thai calendar day. No personal data is ever part of a counter.
 */
export const USAGE_KINDS = ["view", "report", "visit", "helpful", "unhelpful"] as const;
export type UsageKind = (typeof USAGE_KINDS)[number];

export interface UsageEvent {
  kind: UsageKind;
  /** "" for counters that don't belong to a topic (visits, reports not started from a topic). */
  topicId: string;
  /** Thai calendar day, YYYY-MM-DD. */
  day: string;
}

export interface UsageCount extends UsageEvent {
  count: number;
}

export type StatsRange = "7d" | "30d" | "all";
export const STATS_RANGES: readonly StatsRange[] = ["7d", "30d", "all"];

const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar day in Thailand (UTC+7) as YYYY-MM-DD. */
export function bangkokDay(date: Date): string {
  return DAY_FORMAT.format(date);
}

/** First day included in a range ending today (inclusive); null = no lower bound. */
export function sinceDay(range: StatsRange, today: string): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/** Adds one to the matching counter (or starts it at 1); returns a new array. */
export function applyIncrement(rows: UsageCount[], e: UsageEvent): UsageCount[] {
  const i = rows.findIndex((r) => r.day === e.day && r.kind === e.kind && r.topicId === e.topicId);
  if (i === -1) return [...rows, { ...e, count: 1 }];
  return rows.map((r, j) => (j === i ? { ...r, count: r.count + 1 } : r));
}

export function rowsSince(rows: UsageCount[], since: string | null): UsageCount[] {
  return since === null ? rows : rows.filter((r) => r.day >= since);
}
