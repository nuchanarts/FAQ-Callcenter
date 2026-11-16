import { createAdminUserRepository } from "@/repositories/topic-store";
import type { AdminUserRecord, Repositories } from "@/repositories/types";

/** Simulates an unreachable store (Constitution VII "works without a database" tests). */
export function createFailingRepositories(opts: { admins: AdminUserRecord[] }): Repositories {
  const down = async (): Promise<never> => {
    throw new Error("content store unavailable");
  };
  return {
    backend: "failing",
    admins: createAdminUserRepository(opts.admins),
    topics: { list: down, get: down, upsert: down, delete: down },
  };
}
