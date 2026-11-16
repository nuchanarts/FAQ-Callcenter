"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { CategoryTabs } from "@/components/features/home/category-tabs";
import { DegradedNotice } from "@/components/features/home/degraded-notice";
import { SearchBox } from "@/components/features/home/search-box";
import { TopicCard, TopicMeta } from "@/components/features/topic/topic-card";
import { TopicDetail } from "@/components/features/topic/topic-detail";
import type { CategoryId } from "@/domain/categories";
import { countByCategory, normalizeQuery, searchTopics } from "@/domain/search";
import type { EffectiveTopic } from "@/domain/topics";
import { useDebounce } from "@/hooks/use-debounce";
import { useHotkey } from "@/hooks/use-hotkey";
import { useMediaQuery, WIDE_SCREEN_QUERY } from "@/hooks/use-media-query";
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
  // null until hydrated: CSS decides the layout; then JS adds behaviour/ARIA for the size.
  const wideMatch = useMediaQuery(WIDE_SCREEN_QUERY);
  const wide = wideMatch === true;
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = results.find((t) => t.id === selectedId) ?? results[0];

  return (
    <>
      <section className="bg-hero text-hero-ink">
        <div className="page-width pt-8 pb-20 lg:pt-7 lg:pb-16">
          <h1 className="text-[1.85rem] leading-tight font-bold sm:text-[2.35rem]">
            {th.app.tagline}
          </h1>
          <p className="mt-2 max-w-2xl text-hero-ink/80">{th.app.heroLead}</p>
          <div className="mt-5 max-w-3xl">
            <SearchBox ref={searchRef} value={query} onChange={setQuery} />
          </div>
        </div>
      </section>

      <div className="page-width -mt-12 flex flex-col gap-6 pb-16 lg:-mt-10">
        {steps}
        {degraded && <DegradedNotice />}

        <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] 2xl:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20">
            <h2 className="hidden text-lg font-semibold lg:block">{th.categories.label}</h2>
            <CategoryTabs value={category} counts={counts} total={total} onChange={setCategory} />
          </aside>

          <section aria-labelledby="topics-title" className="flex min-w-0 flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="topics-title" className="text-2xl font-semibold">
                {th.search.topicsTitle}
              </h2>
              <p aria-live="polite" className="text-[0.95rem] text-ink-faint">
                {th.search.resultCount(results.length)}
              </p>
            </div>

            {selected ? (
              // CSS decides the layout (no shift after hydration): accordion list below
              // 1280 px, list + answer pane side by side from 1280 px.
              <div className="xl:grid xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] xl:items-start xl:gap-6">
                <div className="overflow-hidden rounded-soft border border-line bg-paper sm:overflow-visible sm:border-0 xl:overflow-hidden xl:border xl:bg-surface">
                  {results.map((t) => (
                    <TopicCard
                      key={t.id}
                      topic={t}
                      wide={wide}
                      selected={t.id === selected.id}
                      onSelect={() => setSelectedId(t.id)}
                    />
                  ))}
                </div>
                {wideMatch !== false && <AnswerPane topic={selected} />}
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
      </div>
    </>
  );
}

/** Wide screens: the chosen topic's answer beside the list (no expanding one by one). */
function AnswerPane({ topic }: { topic: EffectiveTopic }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-soft border border-line bg-surface p-6 shadow-raise xl:block"
    >
      <h2 id={headingId} className="text-2xl font-bold">
        {topic.title}
      </h2>
      <div className="mb-5">
        <TopicMeta topic={topic} />
      </div>
      <TopicDetail topic={topic} />
    </section>
  );
}
