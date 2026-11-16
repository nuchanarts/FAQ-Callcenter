import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_IDS, categoryName, isCategoryId } from "@/domain/categories";
import { LEVELS, isLevel } from "@/domain/levels";
import { parseTopicContent, parseKeywords, TOPIC_LIMITS } from "@/domain/topic";
import { ValidationError } from "@/domain/errors";

const valid = {
  title: "  ขอ Authen Code ไม่ได้  ",
  categoryId: "authen",
  level: "partial",
  keywords: ["ออเทน", "Authen", "authen ", ""],
  solution: "1. เปิดโปรแกรม",
  attachments: [{ kind: "clip", label: "คลิป", url: "https://youtu.be/x" }],
};

describe("categories", () => {
  it("has exactly the 8 constitution categories in order", () => {
    expect(CATEGORIES.map((c) => c.name)).toEqual([
      "เข้าสู่ระบบ / EHP Agent",
      "ตรวจสอบสิทธิ / Authen Code",
      "ส่งเคลม / ส่งออกข้อมูล",
      "การพิมพ์ / เครื่องพิมพ์",
      "ยา / คลังเวชภัณฑ์",
      "บันทึกการให้บริการ",
      "การเงิน / ค่าบริการ",
      "ทะเบียนผู้ป่วย / แบบฟอร์ม",
    ]);
    expect(CATEGORY_IDS).toHaveLength(8);
  });
  it("validates ids and resolves names", () => {
    expect(isCategoryId("authen")).toBe(true);
    expect(isCategoryId("nope")).toBe(false);
    expect(categoryName("print")).toBe("การพิมพ์ / เครื่องพิมพ์");
  });
});

describe("levels", () => {
  it("has the three levels", () => {
    expect(LEVELS).toEqual(["self", "partial", "team"]);
    expect(isLevel("team")).toBe(true);
    expect(isLevel("x")).toBe(false);
  });
});

describe("parseTopicContent", () => {
  it("trims and de-duplicates keywords case-insensitively, dropping blanks", () => {
    const t = parseTopicContent(valid);
    expect(t.title).toBe("ขอ Authen Code ไม่ได้");
    expect(t.keywords).toEqual(["ออเทน", "Authen"]);
  });

  it.each([
    ["title", { title: "   " }],
    ["title", { title: "x".repeat(TOPIC_LIMITS.title + 1) }],
    ["categoryId", { categoryId: "other" }],
    ["level", { level: "maybe" }],
    ["solution", { solution: "" }],
    ["solution", { solution: "x".repeat(TOPIC_LIMITS.solution + 1) }],
    ["keywords", { keywords: Array.from({ length: 21 }, (_, i) => `k${i}`) }],
    ["keywords", { keywords: ["x".repeat(41)] }],
    ["attachments", { attachments: Array.from({ length: 11 }, () => valid.attachments[0]) }],
    ["attachments.0.url", { attachments: [{ kind: "clip", label: "a", url: "http://x.com" }] }],
    [
      "attachments.0.url",
      { attachments: [{ kind: "clip", label: "a", url: "javascript:alert(1)" }] },
    ],
    ["attachments.0.label", { attachments: [{ kind: "clip", label: "", url: "https://x.com" }] }],
    ["attachments.0.kind", { attachments: [{ kind: "video", label: "a", url: "https://x.com" }] }],
  ])("rejects invalid %s", (field, patch) => {
    try {
      parseTopicContent({ ...valid, ...patch });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(Object.keys((e as ValidationError).fieldErrors)).toContain(field);
    }
  });

  it("defaults keywords and attachments to empty arrays", () => {
    const t = parseTopicContent({ ...valid, keywords: undefined, attachments: undefined });
    expect(t.keywords).toEqual([]);
    expect(t.attachments).toEqual([]);
  });
});

describe("parseKeywords", () => {
  it("splits a comma separated string", () => {
    expect(parseKeywords("ออเทน, authen ,, อ่านบัตร")).toEqual(["ออเทน", "authen", "อ่านบัตร"]);
  });
});
