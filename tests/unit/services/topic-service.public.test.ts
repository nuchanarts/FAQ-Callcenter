import { describe, expect, it, vi } from "vitest";
import { createTopicService } from "@/services/topic-service";
import { createMemoryRepositories } from "@/repositories/memory";
import { createFailingRepositories } from "@/repositories/failing";
import type { BaseTopic } from "@/domain/topics";

const base: BaseTopic[] = [
  {
    id: "b-1",
    order: 1,
    title: "หนึ่ง",
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก\n> ถ้ายังไม่ได้",
    attachments: [],
  },
  {
    id: "b-2",
    order: 2,
    title: "สอง",
    categoryId: "print",
    level: "team",
    keywords: [],
    solution: "1. ข\n> ถ้ายังไม่ได้",
    attachments: [],
  },
];

const now = () => new Date("2026-11-16T05:00:00.000Z");

describe("topic service — public", () => {
  it("returns visible merged topics, not degraded", async () => {
    const repos = createMemoryRepositories({ admins: [] });
    await repos.topics.upsert(
      {
        id: "b-2",
        origin: "base",
        content: null,
        hidden: true,
        version: 1,
        createdAt: "x",
        updatedAt: "x",
        updatedBy: "A",
      },
      null,
    );
    const svc = createTopicService({ topics: repos.topics, base, now });
    const result = await svc.getPublicTopics();
    expect(result.degraded).toBe(false);
    expect(result.topics.map((t) => t.id)).toEqual(["b-1"]);
  });

  it("falls back to built-in topics when the store fails (Constitution VII)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const repos = createFailingRepositories({ admins: [] });
    const svc = createTopicService({ topics: repos.topics, base, now });
    const result = await svc.getPublicTopics();
    expect(result.degraded).toBe(true);
    expect(result.topics.map((t) => t.id)).toEqual(["b-1", "b-2"]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("finds a single visible topic for the report form", async () => {
    const svc = createTopicService({
      topics: createMemoryRepositories({ admins: [] }).topics,
      base,
      now,
    });
    expect((await svc.findPublicTopic("b-2"))?.title).toBe("สอง");
    expect(await svc.findPublicTopic("nope")).toBeNull();
  });
});
