import { describe, expect, it } from "vitest";
import {
  formatReportDraft,
  formatReportMessage,
  parseReport,
  prefillDetails,
  REPORTER_FIELDS,
  validateReport,
  type ReportInput,
} from "@/domain/report";
import { ValidationError } from "@/domain/errors";

const valid: ReportInput = {
  fullName: "สมใจ ใจดี",
  position: "นักวิชาการสาธารณสุข",
  unitCode: "03562",
  unitName: "รพ.สต.บ้านตัวอย่าง",
  phone: "081-234-5678",
  email: "",
  anydesk: "123456789",
  details: "[หัวข้อ] ขอ Authen Code ไม่ได้\nเสียบบัตรแล้วไม่ขึ้น",
};

describe("report validation (Constitution III)", () => {
  it.each([
    ["fullName", { fullName: " " }],
    ["position", { position: "" }],
    ["unitCode", { unitCode: "" }],
    ["unitCode", { unitCode: "1234" }],
    ["unitCode", { unitCode: "123456" }],
    ["unitCode", { unitCode: "12a45" }],
    ["unitName", { unitName: "" }],
    ["phone", { phone: "" }],
    ["phone", { phone: "1234" }],
    ["phone", { phone: "1".repeat(16) }],
    ["email", { email: "not-an-email" }],
    ["anydesk", { anydesk: "12345" }],
    ["anydesk", { anydesk: "" }],
    ["details", { details: "" }],
    ["details", { details: "x".repeat(2001) }],
    ["fullName", { fullName: "x".repeat(101) }],
  ])("rejects invalid %s", (field, patch) => {
    const errors = validateReport({ ...valid, ...patch });
    expect(Object.keys(errors)).toContain(field);
  });

  it("accepts unit codes and AnyDesk ids with spaces or dashes", () => {
    const r = parseReport({ ...valid, unitCode: "03 562", anydesk: "123 456 789" });
    expect(r.unitCode).toBe("03562");
    expect(r.anydesk).toBe("123 456 789");
  });

  it("accepts an empty optional email (AnyDesk is required)", () => {
    expect(validateReport(valid)).toEqual({});
  });

  it("parseReport throws a ValidationError with field errors", () => {
    expect(() => parseReport({ ...valid, unitCode: "1" })).toThrow(ValidationError);
  });
});

describe("formatReportMessage", () => {
  it("produces the exact standard template, '-' for an empty email", () => {
    expect(formatReportMessage(parseReport(valid))).toBe(
      [
        "ชื่อ - สกุล ผู้แจ้ง: สมใจ ใจดี",
        "ตำแหน่งงาน : นักวิชาการสาธารณสุข",
        "รหัสหน่วยงาน 5 หลัก : 03562",
        "ชื่อหน่วยงาน : รพ.สต.บ้านตัวอย่าง",
        "เบอร์ติดต่อ : 081-234-5678",
        "อีเมล : -",
        "เลข AnyDesk : 123456789",
        "รายละเอียดปัญหา : [หัวข้อ] ขอ Authen Code ไม่ได้\nเสียบบัตรแล้วไม่ขึ้น",
      ].join("\n"),
    );
  });

  it("includes optional values when given", () => {
    const msg = formatReportMessage(
      parseReport({ ...valid, email: "a@b.co", anydesk: "123456789" }),
    );
    expect(msg).toContain("อีเมล : a@b.co");
    expect(msg).toContain("เลข AnyDesk : 123456789");
  });
});

describe("formatReportDraft (live preview while typing)", () => {
  it("uses the standard labels and shows a placeholder for empty fields", () => {
    const draft = formatReportDraft({ ...valid, fullName: "  ", email: "" });
    const lines = draft.split("\n");
    expect(lines[0]).toBe("ชื่อ - สกุล ผู้แจ้ง: …");
    expect(lines[1]).toBe("ตำแหน่งงาน : นักวิชาการสาธารณสุข");
    expect(lines[5]).toBe("อีเมล : …");
    expect(lines[7]).toMatch(/^รายละเอียดปัญหา : \[หัวข้อ\]/);
  });
});

describe("helpers", () => {
  it("prefills details with the topic title", () => {
    expect(prefillDetails("ขอ Authen Code ไม่ได้")).toBe("[หัวข้อ] ขอ Authen Code ไม่ได้\n");
  });
  it("lists reporter fields to remember (never the problem details)", () => {
    expect(REPORTER_FIELDS).not.toContain("details");
    expect(REPORTER_FIELDS).toHaveLength(7);
  });
});
