import { z } from "zod";
import type { FieldErrors } from "@/domain/errors";
import { parseOrThrow } from "@/domain/validation";
import { th } from "@/i18n/th";

/**
 * Standard problem-report message (Constitution III).
 * The labels and their order are owned by the Call Center team lead — change only via
 * a constitution amendment (MAJOR version).
 */
export const REPORT_LABELS = {
  fullName: "ชื่อ - สกุล ผู้แจ้ง:",
  position: "ตำแหน่งงาน :",
  unitCode: "รหัสหน่วยงาน 5 หลัก :",
  unitName: "ชื่อหน่วยงาน :",
  phone: "เบอร์ติดต่อ :",
  email: "อีเมล :",
  anydesk: "เลข AnyDesk :",
  details: "รายละเอียดปัญหา :",
} as const;

export const REPORT_LIMITS = {
  fullName: 100,
  position: 100,
  unitName: 150,
  details: 2000,
} as const;

const v = th.validation;
const digits = (s: string) => s.replace(/\D/g, "");
const EMPTY = "-";

const requiredText = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));

const reportSchema = z.object({
  fullName: requiredText(REPORT_LIMITS.fullName),
  position: requiredText(REPORT_LIMITS.position),
  unitCode: z
    .string()
    .trim()
    .min(1, v.required)
    .refine((s) => /^[\d\s-]+$/.test(s) && digits(s).length === 5, v.unitCode)
    .transform(digits),
  unitName: requiredText(REPORT_LIMITS.unitName),
  phone: z
    .string()
    .trim()
    .min(1, v.required)
    .refine(
      (s) => /^[\d\s+()-]+$/.test(s) && digits(s).length >= 9 && digits(s).length <= 15,
      v.phone,
    ),
  email: z
    .string()
    .trim()
    .refine((s) => s === "" || z.email().safeParse(s).success, v.email),
  anydesk: z
    .string()
    .trim()
    .refine(
      (s) => s === "" || (/^[\d\s-]+$/.test(s) && [9, 10].includes(digits(s).length)),
      v.anydesk,
    ),
  details: requiredText(REPORT_LIMITS.details),
});

export type ReportInput = z.input<typeof reportSchema>;
export type Report = z.output<typeof reportSchema>;
export type ReportField = keyof ReportInput;

/** Fields remembered in the browser when the user opts in — never the problem details. */
export const REPORTER_FIELDS = [
  "fullName",
  "position",
  "unitCode",
  "unitName",
  "phone",
  "email",
  "anydesk",
] as const satisfies readonly ReportField[];

export const EMPTY_REPORT: ReportInput = {
  fullName: "",
  position: "",
  unitCode: "",
  unitName: "",
  phone: "",
  email: "",
  anydesk: "",
  details: "",
};

export function parseReport(input: ReportInput): Report {
  return parseOrThrow(reportSchema, input);
}

/** Field → first error message (empty object when valid). Used by the form for inline errors. */
export function validateReport(input: ReportInput): Partial<Record<ReportField, string>> {
  const result = reportSchema.safeParse(input);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= [issue.message];
  }
  return Object.fromEntries(Object.entries(errors).map(([k, msgs]) => [k, msgs[0]]));
}

export function formatReportMessage(r: Report): string {
  const line = (field: ReportField, value: string) =>
    `${REPORT_LABELS[field]} ${value.trim() === "" ? EMPTY : value}`;
  return [
    line("fullName", r.fullName),
    line("position", r.position),
    line("unitCode", r.unitCode),
    line("unitName", r.unitName),
    line("phone", r.phone),
    line("email", r.email),
    line("anydesk", r.anydesk),
    line("details", r.details),
  ].join("\n");
}

/** "ยังไม่ได้" → details start with the topic so the team knows what was already tried. */
export function prefillDetails(topicTitle: string): string {
  return `${th.report.topicPrefix} ${topicTitle}\n`;
}
