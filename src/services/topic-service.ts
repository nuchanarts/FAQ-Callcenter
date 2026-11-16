import { mergeTopics, visibleTopics, type BaseTopic, type EffectiveTopic } from "@/domain/topics";
import type { TopicRepository } from "@/repositories/types";

export interface TopicServiceDeps {
  topics: TopicRepository;
  base: BaseTopic[];
  now: () => Date;
}

export interface PublicTopics {
  topics: EffectiveTopic[];
  /** true when the store failed and only built-in content is shown (FR-019). */
  degraded: boolean;
}

/** Topic use cases. All business rules live here or in src/domain (Constitution XIV). */
export function createTopicService(deps: TopicServiceDeps) {
  async function getPublicTopics(): Promise<PublicTopics> {
    try {
      const stored = await deps.topics.list();
      return { topics: visibleTopics(mergeTopics(deps.base, stored)), degraded: false };
    } catch (err) {
      console.error("[topics] store unavailable, serving built-in content", err);
      return { topics: mergeTopics(deps.base, []), degraded: true };
    }
  }

  async function findPublicTopic(id: string): Promise<EffectiveTopic | null> {
    const { topics } = await getPublicTopics();
    return topics.find((t) => t.id === id) ?? null;
  }

  return { getPublicTopics, findPublicTopic };
}

export type TopicService = ReturnType<typeof createTopicService>;
