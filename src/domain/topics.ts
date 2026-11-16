import type { TopicContent } from "@/domain/topic";

export type TopicOrigin = "base" | "custom";
export type TopicStatus = "original" | "edited" | "custom";

/** Built-in topic shipped with the app (read-only source of truth, Constitution VI). */
export interface BaseTopic extends TopicContent {
  id: string;
  order: number;
}

/** What the store keeps: overrides/flags for base topics, full content for custom ones. */
export interface StoredTopic {
  id: string;
  origin: TopicOrigin;
  /** Override (base) or full content (custom). null = no override. */
  content: TopicContent | null;
  hidden: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

/** The topic as viewers and admins see it after merging. version 0 = never stored. */
export interface EffectiveTopic extends TopicContent {
  id: string;
  origin: TopicOrigin;
  status: TopicStatus;
  hidden: boolean;
  order: number;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
}

const CUSTOM_ORDER_OFFSET = 100_000;

function fromBase(b: BaseTopic, s: StoredTopic | undefined): EffectiveTopic {
  const { id, order, ...original } = b;
  return {
    ...(s?.content ?? original),
    id,
    order,
    origin: "base",
    status: s?.content ? "edited" : "original",
    hidden: s?.hidden ?? false,
    version: s?.version ?? 0,
    updatedAt: s?.updatedAt,
    updatedBy: s?.updatedBy,
  };
}

function fromCustom(s: StoredTopic & { content: TopicContent }, index: number): EffectiveTopic {
  return {
    ...s.content,
    id: s.id,
    order: CUSTOM_ORDER_OFFSET + index,
    origin: "custom",
    status: "custom",
    hidden: s.hidden,
    version: s.version,
    updatedAt: s.updatedAt,
    updatedBy: s.updatedBy,
  };
}

/**
 * Merge built-in topics with stored overrides and custom topics.
 * Built-ins keep curated order; custom topics follow, oldest first.
 */
export function mergeTopics(base: BaseTopic[], stored: StoredTopic[]): EffectiveTopic[] {
  const byId = new Map(stored.map((s) => [s.id, s]));
  const builtIns = [...base]
    .sort((a, b) => a.order - b.order)
    .map((b) => fromBase(b, byId.get(b.id)));
  const customs = stored
    .filter(
      (s): s is StoredTopic & { content: TopicContent } => s.origin === "custom" && !!s.content,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(fromCustom);
  return [...builtIns, ...customs];
}

export function visibleTopics(topics: EffectiveTopic[]): EffectiveTopic[] {
  return topics.filter((t) => !t.hidden);
}
