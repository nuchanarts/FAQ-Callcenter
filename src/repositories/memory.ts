import type { StoredTopic } from "@/domain/topics";
import { applyIncrement, rowsSince, type UsageCount } from "@/domain/usage";
import {
  applyUpsert,
  createAdminUserRepository,
  createTaxonomyRepository,
  findTopic,
  listTopics,
} from "@/repositories/topic-store";
import type { AdminUserRecord, Repositories } from "@/repositories/types";

/** Process-local store: used by unit/integration tests and E2E runs. */
export function createMemoryRepositories(opts: { admins: AdminUserRecord[] }): Repositories {
  let records: StoredTopic[] = [];
  let usage: UsageCount[] = [];
  return {
    backend: "memory",
    admins: createAdminUserRepository(opts.admins),
    taxonomy: createTaxonomyRepository(),
    stats: {
      async increment(event) {
        usage = applyIncrement(usage, event);
      },
      async list(since) {
        return structuredClone(rowsSince(usage, since));
      },
    },
    topics: {
      async list() {
        return listTopics(records);
      },
      async get(id) {
        return findTopic(records, id);
      },
      async upsert(topic, expectedVersion) {
        records = applyUpsert(records, topic, expectedVersion);
        return findTopic(records, topic.id)!;
      },
      async delete(id) {
        records = records.filter((r) => r.id !== id);
      },
    },
  };
}
