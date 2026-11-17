import { beforeEach, describe, expect, it } from "vitest";
import type { SessionUser } from "@/auth/session";
import { ForbiddenError, ValidationError } from "@/domain/errors";
import type { TopicContentInput } from "@/domain/topic";
import type { BaseTopic } from "@/domain/topics";
import { createMemoryRepositories } from "@/repositories/memory";
import { createTopicService, type TopicService } from "@/services/topic-service";

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
const author: SessionUser = { id: "w", email: "w@x.y", displayName: "ผู้เขียน", role: "author" };
const approver: SessionUser = { id: "p", email: "p@x.y", displayName: "ผู้อนุมัติ", role: "approver" };
const content = (title: string): TopicContentInput => ({
  title,
  categoryId: "print",
  level: "self",
  keywords: [],
  solution: "1. ทำ",
  attachments: [],
});

let svc: TopicService;
let ids = 0;
beforeEach(() => {
  ids = 0;
  svc = createTopicService({
    topics: createMemoryRepositories({ admins: [] }).topics,
    base,
    now: () => new Date("2026-11-17T05:00:00.000Z"),
    newId: () => `c-${++ids}`,
  });
});

const publicTitles = async () => (await svc.getPublicTopics()).topics.map((t) => t.title);

describe("draft approval", () => {
  it("an author's new topic is a draft viewers can't see until approved", async () => {
    const created = await svc.createTopic(author, content("หัวข้อจากผู้เขียน"));
    expect(created).toMatchObject({ published: false, draft: { status: "pending", by: "ผู้เขียน" } });
    expect(await publicTitles()).not.toContain("หัวข้อจากผู้เขียน");

    const approved = await svc.approveDraft(approver, { id: created.id, expectedVersion: 1 });
    expect(approved).toMatchObject({ published: true, draft: null, title: "หัวข้อจากผู้เขียน" });
    expect(await publicTitles()).toContain("หัวข้อจากผู้เขียน");
  });

  it("an author's edit of a published topic keeps viewers on the published version", async () => {
    const edited = await svc.saveTopic(author, {
      id: "b-1",
      expectedVersion: 0,
      content: content("แก้โดยผู้เขียน"),
    });
    expect(edited.title).toBe("ต้นฉบับ");
    expect(edited.draft?.content.title).toBe("แก้โดยผู้เขียน");
    expect(await publicTitles()).toEqual(["ต้นฉบับ"]);
  });

  it("reject keeps the draft with the reason; the author's resubmission is pending again", async () => {
    await svc.saveTopic(author, { id: "b-1", expectedVersion: 0, content: content("ร่าง 1") });
    const rejected = await svc.rejectDraft(approver, {
      id: "b-1",
      expectedVersion: 1,
      note: "เพิ่มขั้นตอนที่ 2",
    });
    expect(rejected.draft).toMatchObject({ status: "rejected", note: "เพิ่มขั้นตอนที่ 2" });

    const again = await svc.saveTopic(author, {
      id: "b-1",
      expectedVersion: 2,
      content: content("ร่าง 2"),
    });
    expect(again.draft).toMatchObject({ status: "pending", note: null });
  });

  it("reject needs a reason", async () => {
    await svc.saveTopic(author, { id: "b-1", expectedVersion: 0, content: content("ร่าง") });
    await expect(
      svc.rejectDraft(approver, { id: "b-1", expectedVersion: 1, note: "  " }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("an approver publishing directly supersedes the pending draft", async () => {
    await svc.saveTopic(author, { id: "b-1", expectedVersion: 0, content: content("ร่าง") });
    const published = await svc.saveTopic(approver, {
      id: "b-1",
      expectedVersion: 1,
      content: content("เผยแพร่เลย"),
    });
    expect(published).toMatchObject({ title: "เผยแพร่เลย", draft: null });
  });

  it("discarding a draft-only topic removes it; discarding an edit keeps the published one", async () => {
    const created = await svc.createTopic(author, content("ทิ้ง"));
    expect(await svc.discardDraft(author, { id: created.id, expectedVersion: 1 })).toEqual({
      id: created.id,
      removed: true,
    });
    expect((await svc.listForAdmin(approver)).map((t) => t.id)).not.toContain(created.id);

    await svc.saveTopic(author, { id: "b-1", expectedVersion: 0, content: content("ร่าง") });
    expect(await svc.discardDraft(author, { id: "b-1", expectedVersion: 1 })).toMatchObject({
      removed: false,
    });
    expect((await svc.getForAdmin(approver, "b-1")).draft).toBeNull();
  });
});

describe("role rules", () => {
  it("authors cannot approve, reject, hide, restore or delete", async () => {
    await svc.saveTopic(author, { id: "b-1", expectedVersion: 0, content: content("ร่าง") });
    const ref = { id: "b-1", expectedVersion: 1 };
    await expect(svc.approveDraft(author, ref)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(svc.rejectDraft(author, { ...ref, note: "x" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(svc.setHidden(author, { ...ref, hidden: true })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(svc.restoreTopic(author, ref)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(svc.deleteTopic(author, ref)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("approving without a draft is a validation error", async () => {
    await expect(
      svc.approveDraft(approver, { id: "b-1", expectedVersion: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
