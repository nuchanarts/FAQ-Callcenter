import "server-only";
import { BASE_TOPICS } from "@/content/base-topics";
import { getRepositories } from "@/repositories";
import { createGoogleVerifier } from "@/auth/google";
import { getConfig } from "@/lib/config";
import { createAuthService } from "@/services/auth-service";
import { createStatsService, type ViewCountCache } from "@/services/stats-service";
import { createTaxonomyService } from "@/services/taxonomy-service";
import { createTopicService } from "@/services/topic-service";
import { createUserService } from "@/services/user-service";

/** Service instances wired to the configured repositories (used by pages, routes, actions). */
export function topicService() {
  return createTopicService({
    topics: getRepositories().topics,
    base: BASE_TOPICS,
    now: () => new Date(),
    taxonomy: () => taxonomyService().getTaxonomy(),
  });
}

export function taxonomyService() {
  return createTaxonomyService({
    taxonomy: getRepositories().taxonomy,
    topics: getRepositories().topics,
    base: BASE_TOPICS,
  });
}

// One cache per server process (shared by every bundle, like the repositories).
const statsGlobal = globalThis as typeof globalThis & { __bgsViewCounts?: ViewCountCache };

export function statsService() {
  return createStatsService({
    stats: getRepositories().stats,
    now: () => new Date(),
    cache: (statsGlobal.__bgsViewCounts ??= { current: null }),
  });
}

export function userService() {
  return createUserService({ admins: getRepositories().admins });
}

export function authService() {
  return createAuthService({
    admins: getRepositories().admins,
    verifyGoogle: createGoogleVerifier(getConfig().googleClientId),
  });
}
