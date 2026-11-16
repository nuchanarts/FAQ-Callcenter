"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { CategoryTabs } from "@/components/features/home/category-tabs";
import { DegradedNotice } from "@/components/features/home/degraded-notice";
import { SearchBox } from "@/components/features/home/search-box";
import { TopicCard } from "@/components/features/topic/topic-card";
import type { CategoryId } from "@/domain/categories";
import { countByCategory, normalizeQuery, searchTopics } from "@/domain/search";
import type { EffectiveTopic } from "@/domain/topics";
import { useDebounce } from "@/hooks/use-debounce";
import { useHotkey } from "@/hooks/use-hotkey";
import { th } from "@/i18n/th";

const URL_SYNC_MS = 300;

interface HomeScreenProps {
  topics: EffectiveTopic[];
  degraded?: boolean;
  /** Rendered between the hero search and the topic list (the 3 basic steps). */
  steps?: ReactNode;
  /** From ?q= and ?category= so searches can be shared as links. */
  initialQuery?: string;
  initialCategory?: CategoryId | null;
}

/** Mirror search state into the URL without navigating (shareable, survives Back). */
function useUrlSync(query: string, category: CategoryId | null) {
  const debouncedQuery = useDebounce(query, URL_SYNC_MS);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = debouncedQuery.trim();
    if (q) params.set("q", q);
    else params.delete("q");
    if (category) params.set("category", category);
    else params.delete("category");
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [debouncedQuery, category]);
}

/** Viewer home: hero search → 3 basic steps → category chips → topics (US1). */
export function HomeScreen({
  topics,
  degraded = false,
  steps,
  initialQuery = "",
  initialCategory = null,
}: HomeScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | null>(initialCategory);
  const searchRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);
  useUrlSync(query, category);

  useHotkey("/", (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });

  const results = useMemo(
    () => searchTopics(topics, { query: deferredQuery, categoryId: category }),
    [topics, deferredQuery, category],
  );
  const counts = useMemo(() => countByCategory(topics, deferredQuery), [topics, deferredQuery]);
  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const searching = normalizeQuery(deferredQuery) !== "";

  return (
    <>
      <section className="bg-hero text-hero-ink">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:pt-14 sm:pb-28">
          <h1 className="text-[2rem] leading-tight font-bold sm:text-[2.75rem]">
            {th.app.tagline}
          </h1>
          <p className="mt-3 max-w-xl text-hero-ink/80">{th.app.heroLead}</p>
          <div className="mt-6">
            <SearchBox ref={searchRef} value={query} onChange={setQuery} />
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-16 flex max-w-3xl flex-col gap-8 px-4 pb-16">
        {steps}
        {degraded && <DegradedNotice />}

        <section aria-labelledby="topics-title" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="topics-title" className="text-2xl font-semibold">
              {th.search.topicsTitle}
            </h2>
            <p aria-live="polite" className="text-[0.95rem] text-ink-faint">
              {th.search.resultCount(results.length)}
            </p>
          </div>
          <CategoryTabs value={category} counts={counts} total={total} onChange={setCategory} />

          {results.length > 0 ? (
            <div className="overflow-hidden rounded-soft border border-line bg-paper sm:overflow-visible sm:border-0">
              {results.map((t) => (
                <TopicCard key={t.id} topic={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={th.empty.title}
              body={th.empty.body}
              actionLabel={searching ? th.empty.clearSearch : undefined}
              onAction={() => {
                setQuery("");
                setCategory(null);
              }}
              secondary={
                <Link href="/report" className={buttonClass("ghost", "sm")}>
                  {th.empty.goReport}
                </Link>
              }
            />
          )}
        </section>
      </div>
    </>
  );
}
