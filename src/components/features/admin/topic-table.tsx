"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { LevelBadge } from "@/components/features/topic/level-badge";
import { TopicRowActions } from "@/components/features/admin/topic-row-actions";
import { CATEGORIES, categoryName, type CategoryId } from "@/domain/categories";
import { searchTopics } from "@/domain/search";
import type { EffectiveTopic, TopicStatus } from "@/domain/topics";
import { th } from "@/i18n/th";

type StatusFilter = "all" | TopicStatus | "hidden";

const t = th.admin;
const STATUS_TONE = { original: "neutral", edited: "partial", custom: "herb" } as const;

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function matchesStatus(topic: EffectiveTopic, status: StatusFilter): boolean {
  if (status === "all") return true;
  if (status === "hidden") return topic.hidden;
  return topic.status === status;
}

/** Admin topic list with category/status filters and search (FR-018). */
export function TopicTable({ topics }: { topics: EffectiveTopic[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const rows = useMemo(
    () =>
      searchTopics(topics, { query, categoryId: category || null }).filter((x) =>
        matchesStatus(x, status),
      ),
    [topics, query, category, status],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem_11rem]">
        <Input
          type="search"
          aria-label={t.searchPlaceholder}
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          aria-label={t.filterCategory}
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId | "")}
        >
          <option value="">{th.categories.all}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t.filterStatus}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="all">{t.statusAll}</option>
          <option value="original">{t.status.original}</option>
          <option value="edited">{t.status.edited}</option>
          <option value="custom">{t.status.custom}</option>
          <option value="hidden">{t.status.hidden}</option>
        </Select>
      </div>

      <p aria-live="polite" className="text-[0.95rem] text-ink-faint">
        {t.count(rows.length)}
      </p>

      {rows.length === 0 ? (
        <EmptyState title={th.empty.title} body={th.empty.body} />
      ) : (
        <div className="overflow-x-auto rounded-soft border border-line bg-surface">
          <table className="w-full min-w-[46rem] text-left">
            <thead className="border-b border-line bg-surface-muted text-[0.95rem] text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t.columns.title}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t.columns.status}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t.columns.updated}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((topic) => (
                <tr key={topic.id} className="border-b border-line align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <p
                      className={
                        topic.hidden ? "font-semibold text-ink-faint line-through" : "font-semibold"
                      }
                    >
                      {topic.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.9rem] text-ink-faint">
                      <LevelBadge level={topic.level} />
                      {categoryName(topic.categoryId)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={STATUS_TONE[topic.status]}>{t.status[topic.status]}</Badge>
                      {topic.hidden && <Badge tone="danger">{t.status.hidden}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[0.95rem] whitespace-nowrap text-ink-muted">
                    {topic.updatedAt && topic.updatedBy
                      ? t.updatedBy(topic.updatedBy, dateFormat.format(new Date(topic.updatedAt)))
                      : t.neverEdited}
                  </td>
                  <td className="px-4 py-2">
                    <TopicRowActions topic={topic} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
