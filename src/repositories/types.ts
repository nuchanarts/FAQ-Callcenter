import type { AdminRole } from "@/domain/permissions";
import type { StoredTopic } from "@/domain/topics";

export interface TopicRepository {
  list(): Promise<StoredTopic[]>;
  get(id: string): Promise<StoredTopic | null>;
  /**
   * Insert or replace a record.
   * expectedVersion = null → the record must not exist yet.
   * expectedVersion = n    → the stored record must have version n.
   * Throws ConflictError otherwise.
   */
  upsert(topic: StoredTopic, expectedVersion: number | null): Promise<StoredTopic>;
  delete(id: string): Promise<void>;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  passwordHash: string;
}

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUserRecord | null>;
}

export interface Repositories {
  backend: string;
  topics: TopicRepository;
  admins: AdminUserRepository;
}
