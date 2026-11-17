import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import type { NewsItem } from "@/domain/manuals";
import { th } from "@/i18n/th";

/** Slim home-page strip pointing to the newest announcement on the "คู่มือ" page. */
export function LatestNewsBanner({ news }: { news: NewsItem | undefined }) {
  if (!news) return null;
  return (
    <Link
      href="/manuals"
      className="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-soft border border-accent/30 bg-surface px-4 py-3 shadow-raise hover:border-accent"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
        <Megaphone aria-hidden className="size-5" />
      </span>
      {news.badge && (
        <span className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-[0.85rem] font-bold text-accent">
          {news.badge}
        </span>
      )}
      <span className="min-w-0 flex-1 font-semibold text-ink">{news.title}</span>
      <span className="inline-flex items-center gap-1 text-[0.93rem] font-semibold text-herb group-hover:underline">
        {th.manuals.readMore}
        <ArrowRight aria-hidden className="size-4" />
      </span>
    </Link>
  );
}
