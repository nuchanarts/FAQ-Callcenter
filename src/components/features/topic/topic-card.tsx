"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  MessageSquareWarning,
  PlayCircle,
} from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ContentRenderer } from "@/components/features/topic/content-renderer";
import { LevelBadge } from "@/components/features/topic/level-badge";
import { CategoryIcon } from "@/components/features/topic/category-icon";
import { CATEGORIES } from "@/domain/categories";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

const ATTACHMENT_ICONS = { clip: PlayCircle, manual: FileText, link: ExternalLink } as const;

export function reportHref(topicId: string): string {
  return `/report?topic=${encodeURIComponent(topicId)}`;
}

interface TopicCardProps {
  topic: EffectiveTopic;
  defaultOpen?: boolean;
}

/** Expandable topic row: symptom title, category, level, then steps + "ยังไม่ได้" (Constitution I). */
export function TopicCard({ topic, defaultOpen = false }: TopicCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const category = CATEGORIES.find((c) => c.id === topic.categoryId);

  return (
    <article
      className={cn(
        "border-b border-line transition-colors last:border-b-0",
        open && "bg-surface shadow-raise sm:rounded-soft sm:border-transparent",
      )}
    >
      <h3 className="text-lg font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
        >
          <span className="flex-1">
            <span className="block text-ink group-hover:text-herb">{topic.title}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-sans text-[0.95rem] font-normal text-ink-faint">
              <LevelBadge level={topic.level} />
              {category && (
                <span className="inline-flex items-center gap-1.5">
                  <CategoryIcon name={category.icon} />
                  {category.name}
                </span>
              )}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-1 size-6 shrink-0 text-ink-faint transition-transform duration-200",
              open && "rotate-180 text-herb",
            )}
          />
          <span className="sr-only">{open ? th.topic.collapse : th.topic.expand}</span>
        </button>
      </h3>

      {open && (
        <div id={panelId} className="flex flex-col gap-5 px-4 pb-5 sm:px-5 sm:pl-5">
          <ContentRenderer source={topic.solution} />

          {topic.attachments.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-ink">{th.topic.attachments}</p>
              <ul className="flex flex-wrap gap-2">
                {topic.attachments.map((a, i) => {
                  const Icon = ATTACHMENT_ICONS[a.kind];
                  return (
                    <li key={i}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass("secondary", "sm")}
                      >
                        <Icon aria-hidden className="size-4" />
                        {a.label}
                        <span className="sr-only"> {th.topic.opensNewTab}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-soft border border-dashed border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink-muted">{th.topic.notSolvedHint}</p>
            <Link href={reportHref(topic.id)} className={buttonClass("secondary", "md")}>
              <MessageSquareWarning aria-hidden className="size-5" />
              {th.topic.notSolved}
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
