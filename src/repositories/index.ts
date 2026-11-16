import "server-only";
import { join } from "node:path";
import { getConfig } from "@/lib/config";
import { createFailingRepositories } from "@/repositories/failing";
import { createFileRepositories } from "@/repositories/file";
import { createMemoryRepositories } from "@/repositories/memory";
import { demoAdminRecords } from "@/repositories/seed-admins";
import { createSupabaseRepositories } from "@/repositories/supabase";
import type { Repositories } from "@/repositories/types";

function build(): Repositories {
  const config = getConfig();
  const admins = config.allowDemoAdmins ? demoAdminRecords() : [];
  switch (config.backend) {
    case "memory":
      return createMemoryRepositories({ admins });
    case "failing":
      return createFailingRepositories({ admins });
    case "supabase":
      return createSupabaseRepositories(config.supabase!);
    case "file":
      return createFileRepositories({
        // Runtime data file, not a source asset: keep it out of output file tracing.
        file: join(/*turbopackIgnore: true*/ process.cwd(), config.dataFile),
        admins,
      });
  }
}

// Stored on globalThis so every server bundle in one process shares the same store
// (required for the memory backend used by E2E).
const globalStore = globalThis as typeof globalThis & { __bgsRepositories?: Repositories };

/** Process-wide repositories for the configured DATA_BACKEND. */
export function getRepositories(): Repositories {
  globalStore.__bgsRepositories ??= build();
  return globalStore.__bgsRepositories;
}

export function resetRepositoriesForTests(): void {
  globalStore.__bgsRepositories = undefined;
}
