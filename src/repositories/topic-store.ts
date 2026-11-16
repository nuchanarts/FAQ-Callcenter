import { ConflictError } from "@/domain/errors";
import type { StoredTopic } from "@/domain/topics";
import type { AdminUserRecord, AdminUserRepository } from "@/repositories/types";

const clone = <T>(v: T): T => structuredClone(v);

/** Pure upsert rule shared by every in-process adapter (memory, file). */
export function applyUpsert(
  records: StoredTopic[],
  topic: StoredTopic,
  expectedVersion: number | null,
): StoredTopic[] {
  const index = records.findIndex((r) => r.id === topic.id);
  const existing = index >= 0 ? records[index] : undefined;
  if (expectedVersion === null ? existing : existing?.version !== expectedVersion) {
    throw new ConflictError();
  }
  const next = [...records];
  if (index >= 0) next[index] = clone(topic);
  else next.push(clone(topic));
  return next;
}

export function findTopic(records: StoredTopic[], id: string): StoredTopic | null {
  const found = records.find((r) => r.id === id);
  return found ? clone(found) : null;
}

export function listTopics(records: StoredTopic[]): StoredTopic[] {
  return clone(records);
}

export function createAdminUserRepository(admins: AdminUserRecord[]): AdminUserRepository {
  return {
    async findByEmail(email) {
      const key = email.trim().toLowerCase();
      const found = admins.find((a) => a.email.toLowerCase() === key);
      return found ? clone(found) : null;
    },
  };
}
