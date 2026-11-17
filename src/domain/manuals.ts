import { isHttpsUrl } from "@/domain/topic";

/**
 * Manual library ("คู่มือ" page): announcements, Datacheck per health region, One Page
 * manuals, training videos and related links. Edited by the team in a Google Sheet
 * (one tab per type, header row = column keys) — see src/services/manual-service.ts.
 */

export interface NewsLink {
  label: string;
  url: string;
}
export interface NewsItem {
  badge: string;
  date: string;
  title: string;
  /** Paragraphs (one per line in the Sheet cell). */
  body: string[];
  links: NewsLink[];
}
export interface DatacheckRegion {
  region: number;
  url: string;
  provinces: string[];
}
export interface OnePage {
  title: string;
  url: string;
}
export interface Video {
  order: number;
  category: string;
  title: string;
  url: string;
  /** YouTube id for the thumbnail; null when the link isn't YouTube. */
  youtubeId: string | null;
}
export interface RelatedLink {
  title: string;
  description: string;
  url: string;
}

export interface ManualLibrary {
  news: NewsItem[];
  datacheck: DatacheckRegion[];
  onepage: OnePage[];
  videos: Video[];
  links: RelatedLink[];
}

export type ManualTab = keyof ManualLibrary;
export const MANUAL_TABS: ManualTab[] = ["news", "datacheck", "onepage", "videos", "links"];

/** One Sheet row keyed by header name. */
export type Row = Record<string, string>;

const MAX_NEWS_LINKS = 6;
const HIDE_VALUES = new Set(["ไม่", "ไม่แสดง", "ซ่อน", "no", "n", "false", "0", "hide"]);

/** RFC 4180 CSV (quoted fields, "" escapes, newlines inside quotes) → rows of cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** First row = header keys; following rows become objects. */
export function csvToRows(text: string): Row[] {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return body.map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? "").trim()])));
}

const visible = (r: Row) => !HIDE_VALUES.has((r.show ?? "").trim().toLowerCase());
const num = (v: string | undefined, fallback: number) => {
  const n = Number.parseFloat(v ?? "");
  return Number.isFinite(n) ? n : fallback;
};
const byOrder = <T>(items: { item: T; order: number }[]) =>
  items.sort((a, b) => a.order - b.order).map((x) => x.item);

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
      return m?.[1] ?? null;
    }
  } catch {
    // not a URL
  }
  return null;
}

export function parseNews(rows: Row[]): NewsItem[] {
  return byOrder(
    rows.filter(visible).flatMap((r, i) => {
      if (!r.title) return [];
      const links: NewsLink[] = [];
      for (let n = 1; n <= MAX_NEWS_LINKS; n++) {
        const url = r[`link${n}_url`] ?? "";
        const label = r[`link${n}_label`] || url;
        if (url && isHttpsUrl(url)) links.push({ label, url });
      }
      const body = (r.body ?? "")
        .split(/\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      return [
        {
          order: num(r.order, i + 1),
          item: { badge: r.badge ?? "", date: r.date ?? "", title: r.title, body, links },
        },
      ];
    }),
  );
}

export function parseDatacheck(rows: Row[]): DatacheckRegion[] {
  return byOrder(
    rows.filter(visible).flatMap((r, i) => {
      if (!r.url || !isHttpsUrl(r.url)) return [];
      const region = num(r.region, i + 1);
      const provinces = (r.provinces ?? "")
        .split(/[·,、]/)
        .map((p) => p.trim())
        .filter(Boolean);
      return [{ order: region, item: { region, url: r.url, provinces } }];
    }),
  );
}

export function parseOnePages(rows: Row[]): OnePage[] {
  return byOrder(
    rows
      .filter(visible)
      .flatMap((r, i) =>
        r.title && r.url && isHttpsUrl(r.url)
          ? [{ order: num(r.order, i + 1), item: { title: r.title, url: r.url } }]
          : [],
      ),
  );
}

export function parseVideos(rows: Row[]): Video[] {
  return byOrder(
    rows.filter(visible).flatMap((r, i) => {
      if (!r.title || !r.url || !isHttpsUrl(r.url)) return [];
      const order = num(r.order, i + 1);
      return [
        {
          order,
          item: {
            order,
            category: r.category || "อื่น ๆ",
            title: r.title,
            url: r.url,
            youtubeId: youtubeId(r.url),
          },
        },
      ];
    }),
  );
}

export function parseLinks(rows: Row[]): RelatedLink[] {
  return byOrder(
    rows.filter(visible).flatMap((r, i) =>
      r.title && r.url && isHttpsUrl(r.url)
        ? [
            {
              order: num(r.order, i + 1),
              item: { title: r.title, description: r.description ?? "", url: r.url },
            },
          ]
        : [],
    ),
  );
}

export const PARSERS: { [K in ManualTab]: (rows: Row[]) => ManualLibrary[K] } = {
  news: parseNews,
  datacheck: parseDatacheck,
  onepage: parseOnePages,
  videos: parseVideos,
  links: parseLinks,
};

/** Videos grouped by category, keeping first-appearance order of categories. */
export function groupVideos(videos: Video[]): { category: string; videos: Video[] }[] {
  const groups = new Map<string, Video[]>();
  for (const v of videos) groups.set(v.category, [...(groups.get(v.category) ?? []), v]);
  return [...groups].map(([category, list]) => ({ category, videos: list }));
}
