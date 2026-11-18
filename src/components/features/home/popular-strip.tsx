"use client";

import { useId } from "react";
import { Eye, Flame } from "lucide-react";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";

/** "ปัญหาที่พบบ่อย": the most-viewed topics, one tap away, above the list. */
export function PopularStrip({
  topics,
  counts,
  onPick,
}: {
  topics: EffectiveTopic[];
  counts: Record<string, number>;
  onPick: (topicId: string) => void;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-soft border border-danger/25 bg-surface p-4 shadow-raise"
    >
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-semibold">
        <Flame aria-hidden className="size-5 text-danger" />
        {th.stats.frequentTitle}
      </h2>
      <p className="mt-0.5 text-[0.95rem] text-ink-muted">{th.stats.frequentLead}</p>
      <ol className="mt-3 grid gap-2 md:grid-cols-3">
        {topics.map((t, i) => (
          <li key={t.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className="flex h-full w-full items-start gap-3 rounded-soft border border-line bg-paper px-3 py-2.5 text-left hover:border-herb hover:bg-herb-soft"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-danger-soft font-bold text-danger">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{t.title}</span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-[0.9rem] text-ink-faint">
                  <Eye aria-hidden className="size-4" />
                  {th.stats.views(counts[t.id] ?? 0)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
