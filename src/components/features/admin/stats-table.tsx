import Link from "next/link";
import { categoryName, type Taxonomy } from "@/domain/taxonomy";
import { STATS_RANGES, type StatsRange } from "@/domain/usage";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";
import type { AdminStats, TopicStats } from "@/services/stats-service";

const s = th.stats.admin;
const NONE: TopicStats = { views: 0, reports: 0, helpful: 0, unhelpful: 0 };

export interface StatsTopic {
  id: string;
  title: string;
  categoryId: string;
  deleted?: boolean;
}

/** Whole-number percentage, or — when there is nothing to divide by. */
function rate(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}

const fmt = (n: number) => n.toLocaleString("th-TH");

/** /admin/stats: totals, range picker and one row per topic (most viewed first). */
export function StatsView({
  stats,
  topics,
  taxonomy,
  range,
}: {
  stats: AdminStats;
  topics: StatsTopic[];
  taxonomy: Taxonomy;
  range: StatsRange;
}) {
  const known = new Set(topics.map((t) => t.id));
  const rows = [
    ...topics.map((t) => ({
      id: t.id,
      title: t.deleted ? `${t.title} ${s.deletedSuffix}` : t.title,
      category: categoryName(taxonomy, t.categoryId),
      ...(stats.byTopic[t.id] ?? NONE),
    })),
    // Counted topics that no longer exist at all (custom topics deleted for good).
    ...Object.entries(stats.byTopic)
      .filter(([id]) => !known.has(id))
      .map(([id, c]) => ({ id, title: s.deletedTopic, category: "", ...c })),
  ].sort((a, b) => b.views - a.views || b.reports - a.reports);

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label={s.range} className="flex flex-wrap gap-2">
        {STATS_RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/stats?range=${r}`}
            aria-current={r === range ? "page" : undefined}
            className={cn(
              "rounded-pill border px-4 py-1.5 font-semibold",
              r === range
                ? "border-herb bg-herb text-on-herb"
                : "border-line bg-surface text-ink hover:border-herb",
            )}
          >
            {s.ranges[r]}
          </Link>
        ))}
      </nav>

      {stats.degraded && (
        <p
          role="alert"
          className="rounded-soft border border-danger/40 bg-danger-soft px-4 py-3 font-semibold text-danger"
        >
          {s.degraded}
        </p>
      )}

      <ul aria-label={s.summary} className="grid gap-3 sm:grid-cols-3">
        {(
          [
            [s.visits, stats.visits],
            [s.totalViews, stats.views],
            [s.totalReports, stats.reports],
          ] as const
        ).map(([label, value]) => (
          <li key={label} className="rounded-soft border border-line bg-surface p-4">
            <span className="block text-ink-muted">{label}</span>
            <span className="block text-3xl font-bold text-ink tabular-nums">{fmt(value)}</span>
          </li>
        ))}
      </ul>
      <p className="-mt-2 text-[0.95rem] text-ink-faint">{s.hint}</p>

      <div className="overflow-x-auto rounded-soft border border-line bg-surface">
        <table className="w-full min-w-[56rem] text-left">
          <thead className="bg-surface-muted text-[0.95rem] text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                {s.cols.topic}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {s.cols.category}
              </th>
              {[
                s.cols.views,
                s.cols.reports,
                s.cols.reportRate,
                s.cols.helpful,
                s.cols.unhelpful,
                s.cols.helpfulRate,
              ].map((label) => (
                <th key={label} scope="col" className="px-4 py-3 text-right font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold text-ink">{r.title}</td>
                <td className="px-4 py-3 text-ink-muted">{r.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.views)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.reports)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{rate(r.reports, r.views)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.helpful)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.unhelpful)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {rate(r.helpful, r.helpful + r.unhelpful)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
