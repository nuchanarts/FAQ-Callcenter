"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/features/topic/category-icon";
import { LevelBadge } from "@/components/features/topic/level-badge";
import { TopicDetail } from "@/components/features/topic/topic-detail";
import { useTaxonomy } from "@/components/features/taxonomy/taxonomy-context";
import { findCategory } from "@/domain/taxonomy";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

export { reportHref } from "@/components/features/topic/topic-detail";

/** Level badge + category: the same metadata line everywhere a topic is listed. */
export function TopicMeta({ topic }: { topic: EffectiveTopic }) {
  const category = findCategory(useTaxonomy(), topic.categoryId);
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-sans text-[0.95rem] font-normal text-ink-faint">
      <LevelBadge level={topic.level} />
      {category && (
        <span className="inline-flex items-center gap-1.5">
          <CategoryIcon name={category.icon} />
          {category.name}
        </span>
      )}
    </span>
  );
}

interface TopicCardProps {
  topic: EffectiveTopic;
  /** Wide screens (≥ 1280 px): the row selects the topic for the answer pane. */
  wide?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  defaultOpen?: boolean;
}

/**
 * One topic in the list. Below 1280 px it expands in place (accordion); from 1280 px it
 * selects the topic for the answer pane beside the list. Layout is decided by CSS so the
 * server render already matches the screen (no layout shift); JS only switches behaviour
 * and ARIA semantics after hydration.
 */
export function TopicCard({
  topic,
  wide = false,
  selected = false,
  onSelect,
  defaultOpen = false,
}: TopicCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const highlighted = wide && selected;

  return (
    <article
      className={cn(
        "border-b border-line transition-colors last:border-b-0",
        open && !wide && "bg-surface shadow-raise sm:rounded-soft sm:border-transparent",
        open && "xl:bg-transparent xl:shadow-none",
      )}
    >
      <h3 className="text-lg font-semibold xl:text-[1.05rem]">
        <button
          type="button"
          aria-expanded={wide ? undefined : open}
          aria-controls={wide ? undefined : panelId}
          aria-current={highlighted ? "true" : undefined}
          onClick={() => (wide ? onSelect?.() : setOpen((v) => !v))}
          className={cn(
            "group flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5",
            "xl:border-l-4 xl:px-4 xl:py-3.5",
            highlighted
              ? "xl:border-herb xl:bg-herb-soft"
              : "xl:border-transparent xl:hover:bg-surface-muted",
          )}
        >
          <span className="flex-1">
            <span
              className={cn("block group-hover:text-herb", highlighted ? "text-herb" : "text-ink")}
            >
              {topic.title}
            </span>
            <TopicMeta topic={topic} />
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-1 size-6 shrink-0 text-ink-faint transition-transform duration-200 xl:hidden",
              open && "rotate-180 text-herb",
            )}
          />
          <ChevronRight
            aria-hidden
            className={cn(
              "mt-1 hidden size-5 shrink-0 xl:block",
              highlighted ? "text-herb" : "text-ink-faint",
            )}
          />
          {!wide && <span className="sr-only">{open ? th.topic.collapse : th.topic.expand}</span>}
        </button>
      </h3>
      {open && !wide && (
        <div id={panelId} className="px-4 pb-5 sm:px-5 xl:hidden">
          <TopicDetail topic={topic} />
        </div>
      )}
    </article>
  );
}
