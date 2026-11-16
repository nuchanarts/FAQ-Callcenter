import type { TopicContent } from "@/domain/topic";

export type TopicOrigin = "base" | "custom";

/** Built-in topic shipped with the app (read-only source of truth). */
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
