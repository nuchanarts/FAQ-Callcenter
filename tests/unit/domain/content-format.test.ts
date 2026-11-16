import { describe, expect, it } from "vitest";
import { parseContent, parseInline, toPlainText } from "@/domain/content-format";

describe("parseInline", () => {
  it("parses bold, menu paths and https links", () => {
    expect(parseInline("กด **บันทึก** ที่ `Setting › ผู้ใช้งาน` ดู [คู่มือ](https://ex.com/a)")).toEqual([
      { type: "text", text: "กด " },
      { type: "bold", text: "บันทึก" },
      { type: "text", text: " ที่ " },
      { type: "code", text: "Setting › ผู้ใช้งาน" },
      { type: "text", text: " ดู " },
      { type: "link", text: "คู่มือ", href: "https://ex.com/a" },
    ]);
  });

  it("turns non-https links into plain text (Constitution V)", () => {
    expect(parseInline("[x](http://evil.com)")).toEqual([{ type: "text", text: "x" }]);
    expect(parseInline("[x](javascript:alert(1))")).toEqual([
      { type: "text", text: "x" },
      { type: "text", text: ")" },
    ]);
  });

  it("keeps HTML as literal text", () => {
    expect(parseInline("<script>alert(1)</script>")).toEqual([
      { type: "text", text: "<script>alert(1)</script>" },
    ]);
  });

  it("leaves unmatched markers alone", () => {
    expect(parseInline("2 ** 3 and `open")).toEqual([{ type: "text", text: "2 ** 3 and `open" }]);
  });
});

describe("parseContent", () => {
  it("groups ordered steps, bullets, notes and paragraphs", () => {
    const blocks = parseContent(
      [
        "ทำตามนี้",
        "",
        "1. เปิดโปรแกรม",
        "2. กด **เริ่ม**",
        "- ข้อย่อย ก",
        "- ข้อย่อย ข",
        "> ถ้ายังไม่ได้ เตรียมเลข AnyDesk",
        "> แล้วแจ้งทีม",
      ].join("\n"),
    );
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "ordered", "bullets", "note"]);
    expect(blocks[1]).toMatchObject({
      type: "ordered",
      items: [[{ text: "เปิดโปรแกรม" }], expect.any(Array)],
    });
    expect(blocks[3]).toMatchObject({
      type: "note",
      lines: [expect.any(Array), expect.any(Array)],
    });
  });

  it("joins consecutive plain lines into one paragraph with line breaks", () => {
    const [p] = parseContent("บรรทัด 1\nบรรทัด 2");
    expect(p).toEqual({
      type: "paragraph",
      lines: [[{ type: "text", text: "บรรทัด 1" }], [{ type: "text", text: "บรรทัด 2" }]],
    });
  });

  it("accepts Windows line endings and '1)' step markers", () => {
    const blocks = parseContent("1) ก\r\n2) ข");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "ordered" });
  });

  it("returns no blocks for empty text", () => {
    expect(parseContent("  \n ")).toEqual([]);
  });
});

describe("toPlainText", () => {
  it("strips markup for search and previews", () => {
    expect(toPlainText("1. กด **บันทึก**\n> ดู [คู่มือ](https://x.com) ที่ `เมนู`")).toBe(
      "กด บันทึก ดู คู่มือ ที่ เมนู",
    );
  });
});
