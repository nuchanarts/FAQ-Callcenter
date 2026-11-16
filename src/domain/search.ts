import { CATEGORY_IDS, type CategoryId } from "@/domain/categories";
import { toPlainText } from "@/domain/content-format";
import type { EffectiveTopic } from "@/domain/topics";

export const SEARCH_MAX_LENGTH = 200;

/** Field weights: title > keywords > solution (FR-002). */
const WEIGHT = { title: 3, keywords: 2, solution: 1 } as const;
const HAS_WORD = /[\p{L}\p{N}]/u;

/** NFC, lower-case, collapsed whitespace. Used for searchable content (no length cap). */
export function normalizeText(raw: string): string {
  return raw.normalize("NFC").toLocaleLowerCase("th").replace(/\s+/g, " ").trim();
}

/** User input: normalized, max 200 chars; symbol-only input becomes "". */
export function normalizeQuery(raw: string): string {
  const q = normalizeText(raw).slice(0, SEARCH_MAX_LENGTH).trim();
  return HAS_WORD.test(q) ? q : "";
}

interface Haystack {
  title: string;
  keywords: string;
  solution: string;
}

const haystackCache = new WeakMap<EffectiveTopic, Haystack>();

function haystack(t: EffectiveTopic): Haystack {
  let h = haystackCache.get(t);
  if (!h) {
    h = {
      title: normalizeText(t.title),
      keywords: t.keywords.map(normalizeText).join(" | "),
      solution: normalizeText(toPlainText(t.solution)),
    };
    haystackCache.set(t, h);
  }
  return h;
}

/** Score = sum over terms of the best field weight; 0 if any term is missing (AND). */
function score(t: EffectiveTopic, terms: string[]): number {
  const h = haystack(t);
  let total = 0;
  for (const term of terms) {
    const best = h.title.includes(term)
      ? WEIGHT.title
      : h.keywords.includes(term)
        ? WEIGHT.keywords
        : h.solution.includes(term)
          ? WEIGHT.solution
          : 0;
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export interface SearchOptions {
  query: string;
  categoryId?: CategoryId | null;
}

function termsOf(query: string): string[] {
  const q = normalizeQuery(query);
  return q ? q.split(" ") : [];
}

function matches(topics: EffectiveTopic[], terms: string[]) {
  return topics.map((t) => ({ t, s: terms.length ? score(t, terms) : 1 })).filter((x) => x.s > 0);
}

/** Rank topics for a query (FR-002, FR-003). Pure — runs in the browser and in tests. */
export function searchTopics(topics: EffectiveTopic[], opts: SearchOptions): EffectiveTopic[] {
  const terms = termsOf(opts.query);
  const pool = opts.categoryId ? topics.filter((t) => t.categoryId === opts.categoryId) : topics;
  return matches(pool, terms)
    .sort((a, b) => b.s - a.s || a.t.order - b.t.order)
    .map((x) => x.t);
}

/** Matches per category for the current query (category chip counts). */
export function countByCategory(
  topics: EffectiveTopic[],
  query: string,
): Record<CategoryId, number> {
  const counts = Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<
    CategoryId,
    number
  >;
  for (const { t } of matches(topics, termsOf(query))) counts[t.categoryId] += 1;
  return counts;
}
