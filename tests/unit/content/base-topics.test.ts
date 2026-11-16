import { describe, expect, it } from "vitest";
import { BASE_TOPICS } from "@/content/base-topics";
import { CATEGORY_IDS } from "@/domain/categories";
import { parseContent } from "@/domain/content-format";
import { parseTopicContent } from "@/domain/topic";

describe("built-in topics (Constitution content standards)", () => {
  it("are all valid topic content", () => {
    for (const { id: _id, order: _order, ...content } of BASE_TOPICS) {
      expect(() => parseTopicContent(content)).not.toThrow();
    }
  });

  it("have unique ids prefixed b- and unique order", () => {
    const ids = BASE_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("b-"))).toBe(true);
    expect(new Set(BASE_TOPICS.map((t) => t.order)).size).toBe(BASE_TOPICS.length);
  });

  it("cover every one of the 8 categories at least twice", () => {
    for (const c of CATEGORY_IDS) {
      expect(BASE_TOPICS.filter((t) => t.categoryId === c).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("give numbered steps and an 'ถ้ายังไม่ได้' note box", () => {
    for (const t of BASE_TOPICS) {
      const types = parseContent(t.solution).map((b) => b.type);
      expect(types, t.id).toContain("ordered");
      expect(types, t.id).toContain("note");
      expect(t.solution, t.id).toMatch(/> ถ้ายังไม่ได้/);
    }
  });

  it("contain no patient identifiers, secrets, or non-https links", () => {
    const all = BASE_TOPICS.map((t) => JSON.stringify(t)).join("\n");
    expect(all).not.toMatch(/http:\/\//);
    expect(all).not.toMatch(/\b\d{13}\b/);
    expect(all).not.toMatch(/token\s*[:=]|password\s*[:=]/i);
  });
});
