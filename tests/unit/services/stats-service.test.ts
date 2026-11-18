import { describe, expect, it, vi } from "vitest";
import { createMemoryRepositories } from "@/repositories/memory";
import { createStatsService, type ViewCountCache } from "@/services/stats-service";
import type { StatsRepository } from "@/repositories/types";

function setup(start = "2026-11-18T03:00:00Z") {
  const stats = createMemoryRepositories({ admins: [] }).stats;
  let now = new Date(start);
  const cache: ViewCountCache = { current: null };
  const service = createStatsService({ stats, now: () => now, cache });
  return { stats, service, cache, advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

describe("stats service", () => {
  it("record increments with today's Bangkok day", async () => {
    const { stats, service } = setup("2026-11-17T18:30:00Z");
    await service.record("view", "b-1");
    await service.record("visit");
    expect(await stats.list(null)).toEqual([
      { day: "2026-11-18", kind: "view", topicId: "b-1", count: 1 },
      { day: "2026-11-18", kind: "visit", topicId: "", count: 1 },
    ]);
  });

  it("record never throws when the store fails", async () => {
    const failing: StatsRepository = {
      increment: () => Promise.reject(new Error("down")),
      list: () => Promise.reject(new Error("down")),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const service = createStatsService({
      stats: failing,
      now: () => new Date(),
      cache: { current: null },
    });
    await expect(service.record("view", "b-1")).resolves.toBeUndefined();
  });

  it("getViewCounts sums views across days and caches for 60 s", async () => {
    const { stats, service, advance } = setup();
    await stats.increment({ day: "2026-11-17", kind: "view", topicId: "b-1" });
    await stats.increment({ day: "2026-11-18", kind: "view", topicId: "b-1" });
    await stats.increment({ day: "2026-11-18", kind: "report", topicId: "b-1" });
    const list = vi.spyOn(stats, "list");
    expect(await service.getViewCounts()).toEqual({ "b-1": 2 });
    await stats.increment({ day: "2026-11-18", kind: "view", topicId: "b-2" });
    expect(await service.getViewCounts()).toEqual({ "b-1": 2 });
    expect(list).toHaveBeenCalledTimes(1);
    advance(61_000);
    expect(await service.getViewCounts()).toEqual({ "b-1": 2, "b-2": 1 });
  });

  it("getViewCounts returns {} when the store fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const service = createStatsService({
      stats: { increment: vi.fn(), list: () => Promise.reject(new Error("down")) },
      now: () => new Date(),
      cache: { current: null },
    });
    expect(await service.getViewCounts()).toEqual({});
  });

  it("getAdminStats sums each kind per topic within the range", async () => {
    const { stats, service } = setup();
    const inc = (
      day: string,
      kind: "view" | "report" | "visit" | "helpful" | "unhelpful",
      id = "b-1",
    ) => stats.increment({ day, kind, topicId: id });
    await inc("2026-11-01", "view"); // outside 7d
    await inc("2026-11-18", "view");
    await inc("2026-11-12", "view");
    await inc("2026-11-18", "report");
    await inc("2026-11-18", "report", ""); // report not started from a topic
    await inc("2026-11-18", "helpful");
    await inc("2026-11-18", "unhelpful");
    await inc("2026-11-18", "visit", "");
    const s = await service.getAdminStats("7d");
    expect(s).toEqual({
      visits: 1,
      views: 2,
      reports: 2,
      degraded: false,
      byTopic: { "b-1": { views: 2, reports: 1, helpful: 1, unhelpful: 1 } },
    });
    expect((await service.getAdminStats("all")).views).toBe(3);
  });

  it("getAdminStats reports degraded with zeros when the store fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const service = createStatsService({
      stats: { increment: vi.fn(), list: () => Promise.reject(new Error("down")) },
      now: () => new Date(),
      cache: { current: null },
    });
    expect(await service.getAdminStats("30d")).toEqual({
      visits: 0,
      views: 0,
      reports: 0,
      byTopic: {},
      degraded: true,
    });
  });
});
