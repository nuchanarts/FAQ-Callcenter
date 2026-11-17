import { ConflictError } from "@/domain/errors";
import type { StoredTopic } from "@/domain/topics";
import type { Taxonomy } from "@/domain/taxonomy";
import type {
  AdminUserRecord,
  AdminUserRepository,
  StoredTaxonomy,
  TaxonomyRepository,
} from "@/repositories/types";

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

/** Pure admin upsert rule: replace by id, emails unique (case-insensitive). */
export function applyAdminUpsert(
  admins: AdminUserRecord[],
  admin: AdminUserRecord,
): AdminUserRecord[] {
  const record = { ...admin, email: admin.email.trim().toLowerCase() };
  if (admins.some((a) => a.id !== record.id && a.email.toLowerCase() === record.email)) {
    throw new ConflictError();
  }
  const index = admins.findIndex((a) => a.id === record.id);
  const next = [...admins];
  if (index >= 0) next[index] = clone(record);
  else next.push(clone(record));
  return next;
}

export function findAdminByEmail(admins: AdminUserRecord[], email: string): AdminUserRecord | null {
  const key = email.trim().toLowerCase();
  const found = admins.find((a) => a.email.toLowerCase() === key);
  return found ? clone(found) : null;
}

/** Pure taxonomy save rule (optimistic concurrency) shared by in-process adapters. */
export function applyTaxonomySave(
  current: StoredTaxonomy | null,
  taxonomy: Taxonomy,
  expectedVersion: number | null,
): StoredTaxonomy {
  if (expectedVersion === null ? current : current?.version !== expectedVersion) {
    throw new ConflictError();
  }
  return { taxonomy: clone(taxonomy), version: (current?.version ?? 0) + 1 };
}

export function createTaxonomyRepository(): TaxonomyRepository {
  let stored: StoredTaxonomy | null = null;
  return {
    async get() {
      return stored ? clone(stored) : null;
    },
    async save(taxonomy, expectedVersion) {
      stored = applyTaxonomySave(stored, taxonomy, expectedVersion);
      return clone(stored);
    },
  };
}

/** In-process admin store (memory/failing backends; seeded with demo admins when allowed). */
export function createAdminUserRepository(seed: AdminUserRecord[]): AdminUserRepository {
  let admins = clone(seed);
  return {
    async findByEmail(email) {
      return findAdminByEmail(admins, email);
    },
    async list() {
      return clone(admins);
    },
    async upsert(admin) {
      admins = applyAdminUpsert(admins, admin);
      return findAdminByEmail(admins, admin.email)!;
    },
  };
}
