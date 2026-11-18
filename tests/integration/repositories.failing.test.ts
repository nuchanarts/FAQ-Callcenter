import { describe, expect, it } from "vitest";
import { createFailingRepositories } from "@/repositories/failing";

describe("failing adapter", () => {
  it("rejects every topic call", async () => {
    const { topics } = createFailingRepositories({ admins: [] });
    await expect(topics.list()).rejects.toThrow(/unavailable/);
    await expect(topics.get("x")).rejects.toThrow();
  });
});

describe("failing adapter usage counters", () => {
  it("rejects increment and list", async () => {
    const { stats } = createFailingRepositories({ admins: [] });
    await expect(
      stats.increment({ day: "2026-11-18", kind: "view", topicId: "x" }),
    ).rejects.toThrow();
    await expect(stats.list(null)).rejects.toThrow();
  });
});
