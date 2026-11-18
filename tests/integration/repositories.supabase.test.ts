import { describe, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseRepositories } from "@/repositories/supabase";
import { topicRepositoryContract } from "./repositories.contract";
import { statsRepositoryContract } from "./stats.contract";

// Runs the shared contract against a real (disposable!) Supabase project when configured:
//   SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_ROLE_KEY=... npm test
const url = process.env.SUPABASE_TEST_URL;
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (url && serviceRoleKey) {
  topicRepositoryContract("supabase", async () => {
    await createClient(url, serviceRoleKey).from("topics").delete().neq("id", "");
    return createSupabaseRepositories({ url, serviceRoleKey }).topics;
  });
} else {
  describe("TopicRepository contract: supabase", () => {
    it.skip("set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY to run", () => {});
  });
}

if (url && serviceRoleKey) {
  statsRepositoryContract("supabase", async () => {
    await createClient(url, serviceRoleKey).from("usage_daily").delete().neq("kind", "");
    return createSupabaseRepositories({ url, serviceRoleKey }).stats;
  });
}
