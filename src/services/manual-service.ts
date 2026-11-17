import "server-only";
import { BASE_MANUAL_ROWS } from "@/content/base-manuals";
import {
  csvToRows,
  MANUAL_TABS,
  PARSERS,
  type ManualLibrary,
  type ManualTab,
  type Row,
} from "@/domain/manuals";

/**
 * Manual library content from the team's Google Sheet (MANUALS_SHEET_ID), one tab per type.
 * Read through Google's CSV endpoint (the Sheet is shared "anyone with the link can view"),
 * cached in memory for 5 minutes. Any tab that can't be read falls back to the built-in copy,
 * so the page always renders (same "never break" rule as topics).
 */
const TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 8000;

export interface ManualResult {
  library: ManualLibrary;
  /** "sheet" when every tab came from the Sheet, otherwise which tabs used the built-in copy. */
  source: "sheet" | "builtin" | "mixed";
}

let cache: { at: number; sheetId: string; result: ManualResult } | null = null;

export function resetManualCacheForTests() {
  cache = null;
}

export function sheetCsvUrl(sheetId: string, tab: ManualTab): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}

async function fetchTab(sheetId: string, tab: ManualTab): Promise<Row[] | null> {
  try {
    const res = await fetch(sheetCsvUrl(sheetId, tab), {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = res.headers.get("content-type") ?? "";
    // A private Sheet answers 200 with an HTML login page — treat as unreadable.
    if (!res.ok || !type.includes("text/csv")) {
      console.error(`[manuals] ${tab}: HTTP ${res.status} ${type}`);
      return null;
    }
    const rows = csvToRows(await res.text());
    return rows.length > 0 ? rows : null;
  } catch (err) {
    console.error(`[manuals] ${tab}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function build(rowsByTab: Record<ManualTab, Row[]>): ManualLibrary {
  return {
    news: PARSERS.news(rowsByTab.news),
    datacheck: PARSERS.datacheck(rowsByTab.datacheck),
    onepage: PARSERS.onepage(rowsByTab.onepage),
    videos: PARSERS.videos(rowsByTab.videos),
    links: PARSERS.links(rowsByTab.links),
  };
}

export async function getManualLibrary(): Promise<ManualResult> {
  const sheetId = process.env.MANUALS_SHEET_ID?.trim() ?? "";
  if (!sheetId) return { library: build(BASE_MANUAL_ROWS), source: "builtin" };
  if (cache && cache.sheetId === sheetId && Date.now() - cache.at < TTL_MS) return cache.result;

  const fetched = await Promise.all(MANUAL_TABS.map((tab) => fetchTab(sheetId, tab)));
  const rowsByTab = Object.fromEntries(
    MANUAL_TABS.map((tab, i) => [tab, fetched[i] ?? BASE_MANUAL_ROWS[tab]]),
  ) as Record<ManualTab, Row[]>;
  const misses = fetched.filter((r) => r === null).length;
  const result: ManualResult = {
    library: build(rowsByTab),
    source: misses === 0 ? "sheet" : misses === MANUAL_TABS.length ? "builtin" : "mixed",
  };
  // Cache failures briefly too (1 min) so a Sheet outage doesn't add latency to every view.
  cache = { at: misses > 0 ? Date.now() - TTL_MS + 60_000 : Date.now(), sheetId, result };
  return result;
}
