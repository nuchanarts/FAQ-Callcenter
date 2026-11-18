import { beforeEach, describe, expect, it } from "vitest";
import type { StatsRepository } from "@/repositories/types";

/** Shared behaviour every StatsRepository adapter must satisfy. */
export function statsRepositoryContract(name: string, create: () => Promise<StatsRepository>) {
  describe(`StatsRepository contract: ${name}`, () => {
    let repo: StatsRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it("starts empty", async () => {
      expect(await repo.list(null)).toEqual([]);
    });

    it("adds up increments of the same day/kind/topic", async () => {
      await repo.increment({ day: "2026-11-18", kind: "view", topicId: "b-1" });
      await repo.increment({ day: "2026-11-18", kind: "view", topicId: "b-1" });
      expect(await repo.list(null)).toEqual([
        { day: "2026-11-18", kind: "view", topicId: "b-1", count: 2 },
      ]);
    });

    it("keeps different keys apart", async () => {
      await repo.increment({ day: "2026-11-18", kind: "view", topicId: "b-1" });
      await repo.increment({ day: "2026-11-18", kind: "report", topicId: "b-1" });
      await repo.increment({ day: "2026-11-18", kind: "visit", topicId: "" });
      await repo.increment({ day: "2026-11-17", kind: "view", topicId: "b-1" });
      const rows = await repo.list(null);
      expect(rows).toHaveLength(4);
      expect(rows.every((r) => r.count === 1)).toBe(true);
    });

    it("lists only days on or after sinceDay", async () => {
      await repo.increment({ day: "2026-11-17", kind: "view", topicId: "b-1" });
      await repo.increment({ day: "2026-11-18", kind: "view", topicId: "b-1" });
      expect((await repo.list("2026-11-18")).map((r) => r.day)).toEqual(["2026-11-18"]);
    });
  });
}
