import { describe, expect, it, vi } from "vitest";

// A fake PostgREST that, like the real one, returns at most 1000 rows per request.
const MAX_ROWS = 1000;
const table = Array.from({ length: 2345 }, (_, i) => ({
  day: "2026-11-18",
  kind: "view",
  topic_id: `t-${i}`,
  count: 1,
}));
const ranges: [number, number][] = [];

function query() {
  let from = 0;
  let to = Number.MAX_SAFE_INTEGER;
  let since: string | null = null;
  const q = {
    select: () => q,
    order: () => q,
    gte: (_col: string, v: string) => ((since = v), q),
    range: (a: number, b: number) => (ranges.push([a, b]), (from = a), (to = b), q),
    then(resolve: (r: { data: unknown[]; error: null }) => void) {
      const rows = table.filter((r) => !since || r.day >= since);
      const end = Math.min(to + 1, from + MAX_ROWS);
      resolve({ data: rows.slice(from, end), error: null });
    },
  };
  return q;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => query() }),
}));

const { createSupabaseRepositories } = await import("@/repositories/supabase");

describe("supabase usage counters", () => {
  it("reads every row, not just the first 1000 the API returns per request", async () => {
    const repo = createSupabaseRepositories({ url: "https://x.supabase.co", serviceRoleKey: "k" });
    const rows = await repo.stats.list(null);
    expect(rows).toHaveLength(2345);
    expect(new Set(rows.map((r) => r.topicId)).size).toBe(2345);
    expect(ranges.length).toBeGreaterThan(1);
  });
});
