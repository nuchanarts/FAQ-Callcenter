import { describe, expect, it } from "vitest";
import { mergeTopics, visibleTopics, type BaseTopic, type StoredTopic } from "@/domain/topics";
import type { TopicContent } from "@/domain/topic";

const content = (title: string): TopicContent => ({
  title,
  categoryId: "login",
  level: "self",
  keywords: [],
  solution: "1. ทำ",
  attachments: [],
});

const base: BaseTopic[] = [
  { id: "b-2", order: 2, ...content("ต้นฉบับ 2") },
  { id: "b-1", order: 1, ...content("ต้นฉบับ 1") },
];

const stored = (p: Partial<StoredTopic> & { id: string }): StoredTopic => ({
  origin: "base",
  content: null,
  hidden: false,
  version: 1,
  createdAt: "2026-11-16T01:00:00.000Z",
  updatedAt: "2026-11-16T01:00:00.000Z",
  updatedBy: "ผู้ดูแล",
  ...p,
});

describe("mergeTopics", () => {
  it("returns built-in topics in order when nothing is stored", () => {
    const list = mergeTopics(base, []);
    expect(list.map((t) => t.id)).toEqual(["b-1", "b-2"]);
    expect(list[0]).toMatchObject({
      status: "original",
      hidden: false,
      version: 0,
      origin: "base",
    });
    expect(list[0]?.updatedBy).toBeUndefined();
  });

  it("applies overrides as edited", () => {
    const list = mergeTopics(base, [stored({ id: "b-2", content: content("แก้แล้ว"), version: 3 })]);
    expect(list.find((t) => t.id === "b-2")).toMatchObject({
      title: "แก้แล้ว",
      status: "edited",
      version: 3,
      updatedBy: "ผู้ดูแล",
    });
  });

  it("keeps original content for hidden-only records", () => {
    const t = mergeTopics(base, [stored({ id: "b-1", hidden: true })]).find((x) => x.id === "b-1");
    expect(t).toMatchObject({ title: "ต้นฉบับ 1", status: "original", hidden: true, version: 1 });
  });

  it("appends custom topics after built-ins, oldest first", () => {
    const list = mergeTopics(base, [
      stored({
        id: "c-new",
        origin: "custom",
        content: content("ใหม่"),
        createdAt: "2026-11-16T03:00:00.000Z",
      }),
      stored({
        id: "c-old",
        origin: "custom",
        content: content("เก่า"),
        createdAt: "2026-11-16T02:00:00.000Z",
      }),
    ]);
    expect(list.map((t) => t.id)).toEqual(["b-1", "b-2", "c-old", "c-new"]);
    expect(list[2]).toMatchObject({ status: "custom", origin: "custom" });
  });

  it("ignores records for built-ins that no longer exist and custom records without content", () => {
    const list = mergeTopics(base, [
      stored({ id: "b-gone", content: content("x") }),
      stored({ id: "c-broken", origin: "custom", content: null }),
    ]);
    expect(list.map((t) => t.id)).toEqual(["b-1", "b-2"]);
  });
});

describe("visibleTopics", () => {
  it("drops hidden topics", () => {
    const list = mergeTopics(base, [stored({ id: "b-1", hidden: true })]);
    expect(visibleTopics(list).map((t) => t.id)).toEqual(["b-2"]);
  });
});
