import "server-only";
import { BASE_TOPICS } from "@/content/base-topics";
import { getRepositories } from "@/repositories";
import { createGoogleVerifier } from "@/auth/google";
import { getConfig } from "@/lib/config";
import { createAuthService } from "@/services/auth-service";
import { createTopicService } from "@/services/topic-service";
import { createUserService } from "@/services/user-service";

/** Service instances wired to the configured repositories (used by pages, routes, actions). */
export function topicService() {
  return createTopicService({
    topics: getRepositories().topics,
    base: BASE_TOPICS,
    now: () => new Date(),
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
