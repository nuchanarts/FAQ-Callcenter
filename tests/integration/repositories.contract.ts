import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "@/domain/errors";
import type { StoredTopic } from "@/domain/topics";
import type { TopicRepository } from "@/repositories/types";

export function makeStored(overrides: Partial<StoredTopic> = {}): StoredTopic {
  return {
    id: "c-1",
    origin: "custom",
    content: {
      title: "หัวข้อ",
      categoryId: "login",
      level: "self",
      keywords: [],
      solution: "1. ทำ",
      attachments: [],
    },
    hidden: false,
    version: 1,
    createdAt: "2026-11-16T00:00:00.000Z",
    updatedAt: "2026-11-16T00:00:00.000Z",
    updatedBy: "Admin",
    ...overrides,
  };
}

/** Shared behaviour every TopicRepository adapter must satisfy. */
export function topicRepositoryContract(name: string, create: () => Promise<TopicRepository>) {
  describe(`TopicRepository contract: ${name}`, () => {
    let repo: TopicRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it("starts empty", async () => {
      expect(await repo.list()).toEqual([]);
      expect(await repo.get("c-1")).toBeNull();
    });

    it("inserts with expectedVersion null and reads it back", async () => {
      const t = makeStored();
      await repo.upsert(t, null);
      expect(await repo.get("c-1")).toEqual(t);
      expect(await repo.list()).toEqual([t]);
    });

    it("rejects insert when the record already exists", async () => {
      await repo.upsert(makeStored(), null);
      await expect(repo.upsert(makeStored(), null)).rejects.toBeInstanceOf(ConflictError);
    });

    it("updates when expectedVersion matches", async () => {
      await repo.upsert(makeStored(), null);
      const next = makeStored({ version: 2, hidden: true });
      await repo.upsert(next, 1);
      expect(await repo.get("c-1")).toEqual(next);
    });

    it("rejects stale expectedVersion", async () => {
      await repo.upsert(makeStored(), null);
      await repo.upsert(makeStored({ version: 2 }), 1);
      await expect(repo.upsert(makeStored({ version: 2 }), 1)).rejects.toBeInstanceOf(
        ConflictError,
      );
    });

    it("rejects update of a missing record", async () => {
      await expect(repo.upsert(makeStored({ version: 2 }), 1)).rejects.toBeInstanceOf(
        ConflictError,
      );
    });

    it("deletes records (deleting a missing id is a no-op)", async () => {
      await repo.upsert(makeStored(), null);
      await repo.delete("c-1");
      await repo.delete("c-1");
      expect(await repo.get("c-1")).toBeNull();
    });

    it("returns copies, not live references", async () => {
      await repo.upsert(makeStored(), null);
      const got = await repo.get("c-1");
      got!.hidden = true;
      expect((await repo.get("c-1"))!.hidden).toBe(false);
    });
  });
}
