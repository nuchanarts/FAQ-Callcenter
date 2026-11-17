import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/auth/session";
import { ValidationError } from "@/domain/errors";
import { assertCanPublish } from "@/domain/permissions";
import { DEFAULT_TAXONOMY, taxonomySchema, type Taxonomy } from "@/domain/taxonomy";
import { parseOrThrow } from "@/domain/validation";
import { mergeTopics, type BaseTopic } from "@/domain/topics";
import { th } from "@/i18n/th";
import type { TaxonomyRepository, TopicRepository } from "@/repositories/types";

export interface TaxonomyState {
  taxonomy: Taxonomy;
  /** 0 = still the built-in default (never saved). */
  version: number;
}

/** Last good read per repository, so an outage keeps the admins' categories (never the bare default). */
const lastKnown = new WeakMap<TaxonomyRepository, TaxonomyState>();

/** Categories + levels: read for everyone, edited by approvers/owners (Constitution VI). */
export function createTaxonomyService(deps: {
  taxonomy: TaxonomyRepository;
  topics: TopicRepository;
  base: BaseTopic[];
  newId?: () => string;
}) {
  const newId = deps.newId ?? (() => randomUUID().slice(0, 8));

  async function getState(): Promise<TaxonomyState> {
    try {
      const stored = await deps.taxonomy.get();
      const state = stored ?? { taxonomy: DEFAULT_TAXONOMY, version: 0 };
      lastKnown.set(deps.taxonomy, state);
      return state;
    } catch (err) {
      console.error("[taxonomy] store unavailable, using last-known/default", err);
      return lastKnown.get(deps.taxonomy) ?? { taxonomy: DEFAULT_TAXONOMY, version: 0 };
    }
  }

  async function getTaxonomy(): Promise<Taxonomy> {
    return (await getState()).taxonomy;
  }

  /** How many topics (published or draft) use each category / level id. */
  async function usage(): Promise<{
    categories: Record<string, number>;
    levels: Record<string, number>;
  }> {
    const topics = mergeTopics(deps.base, await deps.topics.list());
    const categories: Record<string, number> = {};
    const levels: Record<string, number> = {};
    for (const t of topics) {
      for (const c of [t, t.draft?.content].filter(Boolean)) {
        categories[c!.categoryId] = (categories[c!.categoryId] ?? 0) + 1;
        levels[c!.level] = (levels[c!.level] ?? 0) + 1;
      }
    }
    return { categories, levels };
  }

  async function getForAdmin(actor: SessionUser | null) {
    assertCanPublish(actor);
    const [state, used] = await Promise.all([getState(), usage()]);
    return { ...state, usage: used };
  }

  async function saveTaxonomy(
    actor: SessionUser | null,
    input: { taxonomy: unknown; expectedVersion: number },
  ): Promise<TaxonomyState> {
    assertCanPublish(actor);
    const parsed = parseOrThrow(taxonomySchema, input.taxonomy);
    const withIds = (prefix: string, items: { id: string }[]) =>
      items.map((item) => ({ ...item, id: item.id || `${prefix}-${newId()}` }));
    const next: Taxonomy = {
      categories: withIds("cat", parsed.categories) as Taxonomy["categories"],
      levels: withIds("lvl", parsed.levels) as Taxonomy["levels"],
    };

    for (const list of [next.categories, next.levels]) {
      if (new Set(list.map((x) => x.id)).size !== list.length) {
        throw new ValidationError(th.taxonomy.duplicate);
      }
    }

    // Never orphan a topic: removed ids must be unused.
    const current = (await getState()).taxonomy;
    const used = await usage();
    const removed = [
      ...current.categories
        .filter((c) => !next.categories.some((n) => n.id === c.id) && used.categories[c.id])
        .map((c) => c.name),
      ...current.levels
        .filter((l) => !next.levels.some((n) => n.id === l.id) && used.levels[l.id])
        .map((l) => l.name),
    ];
    if (removed.length > 0) throw new ValidationError(th.taxonomy.inUse(removed.join(", ")));

    const saved = await deps.taxonomy.save(
      next,
      input.expectedVersion === 0 ? null : input.expectedVersion,
    );
    lastKnown.set(deps.taxonomy, saved);
    return saved;
  }

  return { getTaxonomy, getState, getForAdmin, saveTaxonomy, usage };
}

export type TaxonomyService = ReturnType<typeof createTaxonomyService>;
