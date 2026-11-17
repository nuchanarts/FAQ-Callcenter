import { describe, expect, it } from "vitest";
import { countByCategory, normalizeQuery, searchTopics, SEARCH_MAX_LENGTH } from "@/domain/search";
import type { EffectiveTopic } from "@/domain/topics";

function topic(p: Partial<EffectiveTopic> & { id: string }): EffectiveTopic {
  return {
    origin: "base",
    status: "original",
    hidden: false,
    order: 0,
    version: 0,
    published: true,
    draft: null,
    title: "",
    categoryId: "login",
    level: "self",
    keywords: [],
    solution: "",
    attachments: [],
    ...p,
  };
}

const topics = [
  topic({
    id: "a",
    order: 1,
    title: "ขอ Authen Code ไม่ได้",
    categoryId: "authen",
    keywords: ["ออเทน", "อ่านบัตรไม่ได้"],
    solution: "1. ตรวจเครื่องอ่านบัตร",
  }),
  topic({
    id: "b",
    order: 2,
    title: "พิมพ์สติกเกอร์ยาไม่ออก",
    categoryId: "print",
    keywords: ["ปริ้นสติ๊กเกอร์"],
    solution: "เลือกเครื่องพิมพ์ authen",
  }),
  topic({
    id: "c",
    order: 3,
    title: "เข้าระบบไม่ได้",
    categoryId: "login",
    keywords: ["login", "SSO"],
    solution: "ล้างแคช แล้วเข้าผ่าน SSO",
  }),
];

describe("normalizeQuery", () => {
  it("lower-cases, collapses spaces, trims and caps length", () => {
    expect(normalizeQuery("  AUTHEN    Code ")).toBe("authen code");
    expect(normalizeQuery("x".repeat(500))).toHaveLength(SEARCH_MAX_LENGTH);
  });
  it("treats symbol-only input as empty", () => {
    expect(normalizeQuery("  !!! ?? ")).toBe("");
  });
});

describe("searchTopics", () => {
  it("returns all topics in curated order for an empty query", () => {
    expect(searchTopics(topics, { query: "   " }).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("finds topics by colloquial keyword (ออเทน)", () => {
    expect(searchTopics(topics, { query: "ออเทน" }).map((t) => t.id)).toEqual(["a"]);
  });

  it("matches Thai substrings without word spaces", () => {
    expect(searchTopics(topics, { query: "สติกเกอร์" }).map((t) => t.id)).toEqual(["b"]);
  });

  it("ranks title matches above solution matches", () => {
    expect(searchTopics(topics, { query: "authen" }).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("ranks keyword matches above solution matches, ties by order", () => {
    expect(searchTopics(topics, { query: "sso" }).map((t) => t.id)).toEqual(["c"]);
    const tie = [
      topic({ id: "x", order: 2, title: "ก" }),
      topic({ id: "y", order: 1, title: "ก" }),
    ];
    expect(searchTopics(tie, { query: "ก" }).map((t) => t.id)).toEqual(["y", "x"]);
  });

  it("requires every term to match (AND)", () => {
    expect(searchTopics(topics, { query: "authen สติกเกอร์" }).map((t) => t.id)).toEqual(["b"]);
    expect(searchTopics(topics, { query: "authen ไม่มีคำนี้" })).toEqual([]);
  });

  it("finds words anywhere in long solutions, not only the first 200 characters", () => {
    const long = [topic({ id: "l", solution: `${"ก".repeat(1500)} แจ้งเลข AnyDesk` })];
    expect(searchTopics(long, { query: "anydesk" }).map((x) => x.id)).toEqual(["l"]);
  });

  it("filters by category", () => {
    expect(searchTopics(topics, { query: "", categoryId: "login" }).map((t) => t.id)).toEqual([
      "c",
    ]);
  });

  it("searches solution text without markup", () => {
    const t = [topic({ id: "m", solution: "กด **บันทึก** ที่ `Setting › ผู้ใช้งาน`" })];
    expect(searchTopics(t, { query: "กด บันทึก" }).map((x) => x.id)).toEqual(["m"]);
    expect(searchTopics(t, { query: "setting › ผู้ใช้" }).map((x) => x.id)).toEqual(["m"]);
  });

  it("searches 200 topics quickly", () => {
    const many = Array.from({ length: 200 }, (_, i) =>
      topic({ id: `t${i}`, order: i, title: `หัวข้อ ${i} เข้าระบบ`, solution: "ล้างแคช ".repeat(80) }),
    );
    const start = performance.now();
    for (let i = 0; i < 10; i++) searchTopics(many, { query: "แคช เข้า" });
    expect((performance.now() - start) / 10).toBeLessThan(10);
  });
});

describe("countByCategory", () => {
  it("counts matches per category for the current query", () => {
    expect(countByCategory(topics, "")).toMatchObject({ authen: 1, print: 1, login: 1, drug: 0 });
    expect(countByCategory(topics, "authen")).toMatchObject({ authen: 1, print: 1, login: 0 });
  });
});
