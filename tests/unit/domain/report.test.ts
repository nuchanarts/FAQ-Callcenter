import { describe, expect, it } from "vitest";
import {
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
  anydesk: "",
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

  it("accepts optional email and AnyDesk when empty", () => {
    expect(validateReport(valid)).toEqual({});
  });

  it("parseReport throws a ValidationError with field errors", () => {
    expect(() => parseReport({ ...valid, unitCode: "1" })).toThrow(ValidationError);
  });
});

describe("formatReportMessage", () => {
  it("produces the exact standard template, '-' for empty optional fields", () => {
    expect(formatReportMessage(parseReport(valid))).toBe(
      [
        "ชื่อ - สกุล ผู้แจ้ง: สมใจ ใจดี",
        "ตำแหน่งงาน : นักวิชาการสาธารณสุข",
        "รหัสหน่วยงาน 5 หลัก : 03562",
        "ชื่อหน่วยงาน : รพ.สต.บ้านตัวอย่าง",
        "เบอร์ติดต่อ : 081-234-5678",
        "อีเมล : -",
        "เลข AnyDesk : -",
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

describe("helpers", () => {
  it("prefills details with the topic title", () => {
    expect(prefillDetails("ขอ Authen Code ไม่ได้")).toBe("[หัวข้อ] ขอ Authen Code ไม่ได้\n");
  });
  it("lists reporter fields to remember (never the problem details)", () => {
    expect(REPORTER_FIELDS).not.toContain("details");
    expect(REPORTER_FIELDS).toHaveLength(7);
  });
});
