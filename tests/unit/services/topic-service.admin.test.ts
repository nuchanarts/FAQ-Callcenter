import { beforeEach, describe, expect, it } from "vitest";
import { createTopicService, type TopicService } from "@/services/topic-service";
import { createMemoryRepositories } from "@/repositories/memory";
import type { BaseTopic } from "@/domain/topics";
import type { TopicContentInput } from "@/domain/topic";
import type { SessionUser } from "@/auth/session";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/errors";

const base: BaseTopic[] = [
  {
    id: "b-1",
    order: 1,
    title: "ต้นฉบับ",
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "1. ก",
    attachments: [],
  },
];
const admin: SessionUser = { id: "a1", email: "a@b.c", displayName: "ผู้ดูแล", role: "approver" };
const content: TopicContentInput = {
  title: "หัวข้อใหม่",
  categoryId: "print",
  level: "team",
  keywords: ["k"],
  solution: "1. ทำ",
  attachments: [{ kind: "clip", label: "คลิป", url: "https://youtu.be/x" }],
};

let svc: TopicService;
let ids = 0;
beforeEach(() => {
  ids = 0;
  svc = createTopicService({
    topics: createMemoryRepositories({ admins: [] }).topics,
    base,
    now: () => new Date("2026-11-16T05:00:00.000Z"),
    newId: () => `c-${++ids}`,
  });
});

describe("permissions (FR-012, SC-005)", () => {
  it("rejects every admin operation without a session", async () => {
    await expect(svc.listForAdmin(null)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(svc.createTopic(null, content)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      svc.saveTopic(null, { id: "b-1", expectedVersion: 0, content }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      svc.setHidden(null, { id: "b-1", hidden: true, expectedVersion: 0 }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(svc.restoreTopic(null, { id: "b-1", expectedVersion: 0 })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(svc.deleteTopic(null, { id: "c-1", expectedVersion: 1 })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(svc.getForAdmin(null, "b-1")).rejects.toBeInstanceOf(UnauthorizedError);
  });
  it("rejects unknown roles", async () => {
    await expect(svc.listForAdmin({ ...admin, role: "viewer" as never })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("built-in topics: override, hide, restore (Constitution VI)", () => {
  it("saves an override without touching the original and shows it to viewers", async () => {
    const saved = await svc.saveTopic(admin, { id: "b-1", expectedVersion: 0, content });
    expect(saved).toMatchObject({
      id: "b-1",
      status: "edited",
      title: "หัวข้อใหม่",
      version: 1,
      updatedBy: "ผู้ดูแล",
    });
    expect(base[0]!.title).toBe("ต้นฉบับ");
    expect((await svc.getPublicTopics()).topics[0]?.title).toBe("หัวข้อใหม่");
  });

  it("restores the original content", async () => {
    await svc.saveTopic(admin, { id: "b-1", expectedVersion: 0, content });
    const restored = await svc.restoreTopic(admin, { id: "b-1", expectedVersion: 1 });
    expect(restored).toMatchObject({ title: "ต้นฉบับ", status: "original", version: 2 });
  });

  it("hides and shows a topic, keeping any override", async () => {
    await svc.saveTopic(admin, { id: "b-1", expectedVersion: 0, content });
    const hidden = await svc.setHidden(admin, { id: "b-1", hidden: true, expectedVersion: 1 });
    expect(hidden).toMatchObject({ hidden: true, title: "หัวข้อใหม่" });
    expect((await svc.getPublicTopics()).topics).toHaveLength(0);
    expect(await svc.listForAdmin(admin)).toHaveLength(1);
    await svc.setHidden(admin, { id: "b-1", hidden: false, expectedVersion: 2 });
    expect((await svc.getPublicTopics()).topics).toHaveLength(1);
  });

  it("can hide a never-edited built-in topic", async () => {
    const t = await svc.setHidden(admin, { id: "b-1", hidden: true, expectedVersion: 0 });
    expect(t).toMatchObject({ hidden: true, status: "original", version: 1 });
  });

  it("soft-deletes built-in topics (gone for viewers, restorable by approvers)", async () => {
    expect(await svc.deleteTopic(admin, { id: "b-1", expectedVersion: 0 })).toEqual({ id: "b-1" });
    expect((await svc.getPublicTopics()).topics.map((t) => t.id)).not.toContain("b-1");
    expect((await svc.getForAdmin(admin, "b-1")).deleted).toBe(true);
    const back = await svc.undeleteTopic(admin, { id: "b-1", expectedVersion: 1 });
    expect(back.deleted).toBe(false);
    expect((await svc.getPublicTopics()).topics.map((t) => t.id)).toContain("b-1");
  });

  it("restoring a never-edited topic is a harmless no-op", async () => {
    expect(await svc.restoreTopic(admin, { id: "b-1", expectedVersion: 0 })).toMatchObject({
      status: "original",
      version: 0,
    });
  });
});

describe("custom topics", () => {
  it("creates, edits and deletes", async () => {
    const created = await svc.createTopic(admin, content);
    expect(created).toMatchObject({ id: "c-1", status: "custom", origin: "custom", version: 1 });
    const edited = await svc.saveTopic(admin, {
      id: "c-1",
      expectedVersion: 1,
      content: { ...content, title: "แก้" },
    });
    expect(edited).toMatchObject({ title: "แก้", version: 2 });
    await svc.deleteTopic(admin, { id: "c-1", expectedVersion: 2 });
    await expect(svc.getForAdmin(admin, "c-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("cannot be 'restored'", async () => {
    await svc.createTopic(admin, content);
    await expect(svc.restoreTopic(admin, { id: "c-1", expectedVersion: 1 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("deleting a missing topic reports not found", async () => {
    await expect(
      svc.deleteTopic(admin, { id: "c-404", expectedVersion: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("validation and conflicts", () => {
  it("validates content (https-only links, required fields)", async () => {
    await expect(
      svc.createTopic(admin, {
        ...content,
        attachments: [{ kind: "link", label: "x", url: "http://x" }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.createTopic(admin, { ...content, title: "" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("refuses stale saves (FR-017)", async () => {
    await svc.saveTopic(admin, { id: "b-1", expectedVersion: 0, content });
    await expect(
      svc.saveTopic(admin, { id: "b-1", expectedVersion: 0, content }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      svc.setHidden(admin, { id: "b-1", hidden: true, expectedVersion: 5 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to delete a custom topic someone else just changed", async () => {
    await svc.createTopic(admin, content);
    await svc.saveTopic(admin, {
      id: "c-1",
      expectedVersion: 1,
      content: { ...content, title: "ใหม่กว่า" },
    });
    await expect(svc.deleteTopic(admin, { id: "c-1", expectedVersion: 1 })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await svc.getForAdmin(admin, "c-1")).title).toBe("ใหม่กว่า");
  });

  it("reports unknown ids as not found", async () => {
    await expect(
      svc.saveTopic(admin, { id: "nope", expectedVersion: 0, content }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("listForAdmin", () => {
  it("returns hidden and visible topics with status metadata", async () => {
    await svc.createTopic(admin, content);
    await svc.setHidden(admin, { id: "b-1", hidden: true, expectedVersion: 0 });
    const list = await svc.listForAdmin(admin);
    expect(list.map((t) => [t.id, t.status, t.hidden])).toEqual([
      ["b-1", "original", true],
      ["c-1", "custom", false],
    ]);
  });
});
