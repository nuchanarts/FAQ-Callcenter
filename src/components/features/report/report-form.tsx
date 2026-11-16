"use client";

import { useRef, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { MessagePreview } from "@/components/features/report/message-preview";
import {
  EMPTY_REPORT,
  formatReportMessage,
  parseReport,
  prefillDetails,
  REPORT_LIMITS,
  REPORTER_FIELDS,
  validateReport,
  type ReportField,
  type ReportInput,
} from "@/domain/report";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { th } from "@/i18n/th";

export const REPORTER_STORAGE_KEY = "bgs-faq.reporter";

type Reporter = Pick<ReportInput, (typeof REPORTER_FIELDS)[number]>;
type Errors = Partial<Record<ReportField, string>>;

const FIELD_ORDER: ReportField[] = [...REPORTER_FIELDS, "details"];
const f = th.report.fields;

function pickReporter(values: ReportInput): Reporter {
  return Object.fromEntries(REPORTER_FIELDS.map((k) => [k, values[k]])) as Reporter;
}

/**
 * Report form (US2). Builds the team's standard message locally — nothing is sent to the
 * server, and reporter details are remembered only in this browser when opted in (Constitution V).
 */
export function ReportForm({ topicTitle }: { topicTitle?: string }) {
  const stored = useLocalStorage<Reporter | null>(REPORTER_STORAGE_KEY, null);
  const [edits, setEdits] = useState<Partial<ReportInput>>({});
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const defaults: ReportInput = {
    ...EMPTY_REPORT,
    ...(stored.value ?? {}),
    details: topicTitle ? prefillDetails(topicTitle) : "",
  };
  const values: ReportInput = { ...defaults, ...edits };
  const remember = rememberChoice ?? stored.value !== null;

  function update(field: ReportField, value: string) {
    setEdits((e) => ({ ...e, [field]: value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
    setMessage(null);
  }

  function toggleRemember(checked: boolean) {
    setRememberChoice(checked);
    if (!checked) stored.remove();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateReport(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((k) => found[k]);
    if (firstInvalid) {
      setShowSummary(true);
      setMessage(null);
      const el = formRef.current?.elements.namedItem(firstInvalid);
      if (el instanceof HTMLElement) el.focus();
      return;
    }
    setShowSummary(false);
    if (remember) stored.set(pickReporter(values));
    setMessage(formatReportMessage(parseReport(values)));
  }

  const text = (
    field: ReportField,
    opts: {
      hint?: string;
      optional?: boolean;
      inputMode?: "numeric" | "tel" | "email";
      type?: string;
      autoComplete?: string;
    } = {},
  ) => (
    <Field
      label={f[field]}
      name={field}
      hint={opts.hint}
      error={errors[field]}
      required={!opts.optional}
      optional={opts.optional}
    >
      {(props) => (
        <Input
          {...props}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          value={values[field]}
          onChange={(e) => update(field, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        <p className="flex gap-2 rounded-soft bg-herb-soft px-4 py-3 text-ink">
          <ShieldCheck aria-hidden className="mt-1 size-5 shrink-0 text-herb" />
          {th.report.privacy}
        </p>

        {showSummary && Object.values(errors).some(Boolean) && (
          <p
            role="alert"
            className="rounded-soft border border-danger/40 bg-danger-soft px-4 py-3 font-semibold text-danger"
          >
            {th.report.fixErrors}
          </p>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-display text-xl font-semibold">
            {th.report.reporterSection}
          </legend>
          {text("fullName", { autoComplete: "name" })}
          {text("position", { autoComplete: "organization-title" })}
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            {text("unitCode", { hint: th.report.hints.unitCode, inputMode: "numeric" })}
            {text("unitName", { autoComplete: "organization" })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("phone", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
            {text("email", {
              optional: true,
              type: "email",
              inputMode: "email",
              autoComplete: "email",
            })}
          </div>
          {text("anydesk", { optional: true, hint: th.report.hints.anydesk, inputMode: "numeric" })}
          <label className="flex items-start gap-3 rounded-soft border border-line bg-surface px-4 py-3">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => toggleRemember(e.target.checked)}
              className="mt-1.5 size-5 accent-herb"
            />
            <span>
              <span className="font-semibold">{th.report.remember}</span>
              <span className="block text-[0.95rem] text-ink-faint">{th.report.rememberHint}</span>
            </span>
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-display text-xl font-semibold">
            {th.report.problemSection}
          </legend>
          <Field
            label={f.details}
            name="details"
            hint={th.report.hints.details}
            error={errors.details}
            required
          >
            {(props) => (
              <Textarea
                {...props}
                rows={6}
                maxLength={REPORT_LIMITS.details}
                value={values.details}
                onChange={(e) => update("details", e.target.value)}
              />
            )}
          </Field>
        </fieldset>

        <Button type="submit" size="lg" className="self-start">
          {th.report.generate}
        </Button>
      </form>

      <div className="lg:sticky lg:top-24">{message && <MessagePreview message={message} />}</div>
    </div>
  );
}
