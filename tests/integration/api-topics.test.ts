import { beforeEach, describe, expect, it } from "vitest";
import { GET as getTopics } from "@/app/api/topics/route";
import { GET as getHealth } from "@/app/api/health/route";
import { getRepositories, resetRepositoriesForTests } from "@/repositories";
import { BASE_TOPICS } from "@/content/base-topics";

beforeEach(() => resetRepositoriesForTests());

describe("GET /api/topics", () => {
  it("returns visible topics without hidden ones, never cached", async () => {
    const first = BASE_TOPICS[0]!;
    await getRepositories().topics.upsert(
      {
        id: first.id,
        origin: "base",
        content: null,
        hidden: true,
        version: 1,
        createdAt: "2026-11-16T00:00:00.000Z",
        updatedAt: "2026-11-16T00:00:00.000Z",
        updatedBy: "A",
      },
      null,
    );
    const res = await getTopics();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    const body = (await res.json()) as { topics: { id: string }[]; degraded: boolean };
    expect(body.degraded).toBe(false);
    expect(body.topics).toHaveLength(BASE_TOPICS.length - 1);
    expect(body.topics.some((t) => t.id === first.id)).toBe(false);
  });
});

describe("GET /api/health", () => {
  it("reports the backend", async () => {
    const res = await getHealth();
    expect(await res.json()).toEqual({ ok: true, backend: "memory" });
  });
});
