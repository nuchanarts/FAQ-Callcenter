"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookImage,
  ExternalLink,
  FileText,
  Link2,
  Megaphone,
  Play,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { groupVideos, type ManualLibrary, type Video } from "@/domain/manuals";
import { normalizeQuery, normalizeText } from "@/domain/search";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

const m = th.manuals;

type Filter = "all" | "datacheck" | "onepage" | "links" | `video:${string}`;

const matches = (q: string, ...fields: string[]) =>
  q === "" || fields.some((f) => normalizeText(f).includes(q));

/** Manual library: search + category chips over announcements, Datacheck, One Page, videos, links. */
export function ManualLibraryView({ library }: { library: ManualLibrary }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const q = normalizeQuery(useDeferredValue(query));

  const groups = useMemo(() => groupVideos(library.videos), [library.videos]);
  const show = (f: Filter) => filter === "all" || filter === f;

  const datacheck = library.datacheck.filter((d) =>
    matches(q, m.region(d.region), m.regionShort(d.region), "datacheck", ...d.provinces),
  );
  const onepage = library.onepage.filter((o) => matches(q, o.title, "one page"));
  const links = library.links.filter((l) => matches(q, l.title, l.description));
  const videoGroups = groups
    .map((g) => ({ ...g, videos: g.videos.filter((v) => matches(q, v.title, g.category)) }))
    .filter((g) => g.videos.length > 0 && show(`video:${g.category}`));

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "datacheck", label: "Datacheck", count: library.datacheck.length },
    { id: "onepage", label: "One Page", count: library.onepage.length },
    ...groups.map((g) => ({
      id: `video:${g.category}` as Filter,
      label: g.category,
      count: g.videos.length,
    })),
    { id: "links", label: m.linksTitle, count: library.links.length },
  ];

  const nothing =
    (!show("datacheck") || datacheck.length === 0) &&
    (!show("onepage") || onepage.length === 0) &&
    (!show("links") || links.length === 0) &&
    videoGroups.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {library.news.length > 0 && q === "" && filter === "all" && (
        <section aria-labelledby="news-title" className="flex flex-col gap-4">
          <SectionHead id="news-title" icon={Megaphone} title={m.newsTitle} />
          <div className="grid gap-4 xl:grid-cols-2">
            {library.news.map((n) => (
              <article
                key={n.title}
                className="flex flex-col gap-3 rounded-soft border border-line border-t-4 border-t-herb bg-surface p-5 shadow-raise"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {n.badge && (
                    <span
                      className={cn(
                        "rounded-pill px-2.5 py-0.5 text-[0.85rem] font-bold",
                        n.badge.toUpperCase() === "NEW"
                          ? "bg-accent text-white"
                          : "bg-herb-soft text-herb",
                      )}
                    >
                      {n.badge}
                    </span>
                  )}
                  {n.date && <span className="text-[0.9rem] text-ink-faint">{n.date}</span>}
                </div>
                <h3 className="text-xl font-bold">{n.title}</h3>
                {n.body.map((p) => (
                  <p key={p} className="leading-[1.65] text-ink-muted">
                    {p}
                  </p>
                ))}
                {n.links.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {n.links.map((l) => (
                      <li key={l.url}>
                        <ExternalA
                          href={l.url}
                          className="inline-flex items-center gap-1.5 rounded-pill border border-line-strong bg-paper px-3 py-1.5 text-[0.93rem] font-semibold text-herb hover:border-herb"
                        >
                          {l.label}
                          <ArrowUpRight aria-hidden className="size-4" />
                        </ExternalA>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-16 z-30 -mx-4 flex flex-col gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-soft sm:border sm:px-4">
        <div role="search" className="relative">
          <label htmlFor="manual-search" className="sr-only">
            {m.searchLabel}
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-herb"
          />
          <input
            id="manual-search"
            type="search"
            autoComplete="off"
            value={query}
            placeholder={m.searchPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            className="h-13 w-full rounded-soft border-2 border-line-strong bg-surface pr-12 pl-12 text-lg text-ink placeholder:text-ink-faint focus:border-herb focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint hover:bg-surface-muted"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">{m.clear}</span>
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label={m.filterLabel}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible"
        >
          {[{ id: "all" as Filter, label: m.all, count: undefined }, ...chips].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-pill border px-3.5 text-[0.93rem] font-semibold whitespace-nowrap",
                filter === c.id
                  ? "border-herb bg-herb text-on-herb"
                  : "border-line-strong bg-surface text-ink-muted hover:border-herb hover:text-herb",
              )}
            >
              {c.label}
              {c.count !== undefined && (
                <span
                  className={cn(
                    "rounded-pill px-1.5 text-[0.8rem] tabular-nums",
                    filter === c.id ? "bg-herb-strong" : "bg-surface-muted",
                  )}
                >
                  {c.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {nothing && (
        <EmptyState
          title={m.empty}
          body={m.emptyBody}
          actionLabel={m.clear}
          onAction={() => {
            setQuery("");
            setFilter("all");
          }}
        />
      )}

      {show("datacheck") && datacheck.length > 0 && (
        <section aria-labelledby="dc-title" className="flex flex-col gap-4">
          <SectionHead
            id="dc-title"
            icon={ShieldCheck}
            title={m.datacheckTitle}
            sub={m.datacheckLead}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {datacheck.map((d) => (
              <li key={d.region}>
                <ExternalA
                  href={d.url}
                  className="group flex h-full flex-col gap-2 rounded-soft border border-line bg-surface p-4 hover:border-herb hover:shadow-raise"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-soft bg-herb font-display text-lg font-bold text-on-herb">
                      {d.region}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{m.region(d.region)}</span>
                      <span className="block truncate text-[0.85rem] text-ink-faint">
                        {d.url.replace(/^https:\/\//, "")}
                      </span>
                    </span>
                  </span>
                  <span className="text-[0.93rem] leading-[1.6] text-ink-muted">
                    {d.provinces.join(" · ")}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1 text-[0.93rem] font-semibold text-herb group-hover:underline">
                    {m.openDatacheck}
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </ExternalA>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show("onepage") && onepage.length > 0 && (
        <section aria-labelledby="op-title" className="flex flex-col gap-4">
          <SectionHead
            id="op-title"
            icon={BookImage}
            title={m.onepageTitle}
            sub={m.items(onepage.length)}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {onepage.map((o) => (
              <li key={o.url}>
                <ExternalA
                  href={o.url}
                  className="group flex h-full items-start gap-3 rounded-soft border border-line bg-surface p-4 hover:border-herb hover:shadow-raise"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-soft bg-level-team-soft text-level-team">
                    <FileText aria-hidden className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-semibold leading-snug text-ink">{o.title}</span>
                    <span className="inline-flex items-center gap-1 text-[0.9rem] font-semibold text-herb group-hover:underline">
                      {m.onepageOpen}
                      <ArrowUpRight aria-hidden className="size-4" />
                    </span>
                  </span>
                </ExternalA>
              </li>
            ))}
          </ul>
        </section>
      )}

      {videoGroups.map((g) => (
        <section
          key={g.category}
          aria-labelledby={`v-${g.category}`}
          className="flex flex-col gap-4"
        >
          <SectionHead
            id={`v-${g.category}`}
            icon={Play}
            title={`${m.videosTitle} · ${g.category}`}
            sub={m.items(g.videos.length)}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {g.videos.map((v) => (
              <li key={v.url}>
                <VideoCard video={v} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {show("links") && links.length > 0 && (
        <section aria-labelledby="links-title" className="flex flex-col gap-4">
          <SectionHead id="links-title" icon={Link2} title={m.linksTitle} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((l) => (
              <li key={l.url}>
                <ExternalA
                  href={l.url}
                  className="group flex h-full items-start gap-3 rounded-soft border border-line bg-surface p-4 hover:border-herb hover:shadow-raise"
                >
                  <ExternalLink aria-hidden className="mt-1 size-5 shrink-0 text-herb" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink group-hover:underline">
                      {l.title}
                    </span>
                    {l.description && (
                      <span className="block text-[0.93rem] text-ink-muted">{l.description}</span>
                    )}
                  </span>
                </ExternalA>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionHead({
  id,
  icon: Icon,
  title,
  sub,
}: {
  id: string;
  icon: typeof Play;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-soft bg-herb text-on-herb">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 id={id} className="text-xl font-bold">
          {title}
        </h2>
        {sub && <p className="text-[0.93rem] text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}

function ExternalA({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> {m.opensNewTab}</span>
    </a>
  );
}

function VideoCard({ video }: { video: Video }) {
  return (
    <ExternalA
      href={video.url}
      className="group flex h-full flex-col overflow-hidden rounded-soft border border-line bg-surface hover:border-herb hover:shadow-raise"
    >
      <span className="relative block aspect-video bg-gradient-to-br from-herb-strong to-herb">
        {video.youtubeId && (
          // Plain <img>: YouTube thumbnails, no Next image optimizer needed for a 320px preview.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[0.8rem] font-bold text-white tabular-nums">
          #{video.order}
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-herb shadow-raise transition-transform group-hover:scale-110">
            <Play aria-hidden className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="font-semibold leading-snug text-ink">{video.title}</span>
        <span className="mt-auto text-[0.88rem] font-semibold text-herb group-hover:underline">
          {m.watch}
        </span>
      </span>
    </ExternalA>
  );
}
