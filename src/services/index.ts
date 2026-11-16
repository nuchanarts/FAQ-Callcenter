import "server-only";
import { BASE_TOPICS } from "@/content/base-topics";
import { getRepositories } from "@/repositories";
import { createTopicService } from "@/services/topic-service";

/** Service instances wired to the configured repositories (used by pages, routes, actions). */
export function topicService() {
  return createTopicService({
    topics: getRepositories().topics,
    base: BASE_TOPICS,
    now: () => new Date(),
  });
}
