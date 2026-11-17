"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { MessagePreview } from "@/components/features/report/message-preview";
import {
  EMPTY_REPORT,
  formatReportDraft,
  formatReportMessage,
  parseReport,
  prefillDetails,
  REPORT_LIMITS,
  REPORTER_FIELDS,
  validateReport,
  type ReportField,
  type ReportInput,
} from "@/domain/report";
import { POSITIONS } from "@/domain/positions";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { th } from "@/i18n/th";

export const REPORTER_STORAGE_KEY = "bgs-faq.reporter";

/** Shape returned by /api/units/[code] (src/services/unit-directory.ts). */
interface HealthUnit {
  code: string;
  name: string;
  tambon: string;
  amphoe: string;
  province: string;
  active: boolean;
}

type UnitLookup =
  { status: "idle" | "loading" | "notfound" } | { status: "found"; unit: HealthUnit };

function UnitStatus({ lookup }: { lookup: UnitLookup }) {
  const u = th.report.unitLookup;
  if (lookup.status === "idle") return null;
  if (lookup.status === "loading")
    return (
      <p role="status" className="-mt-2 flex items-center gap-2 text-[0.95rem] text-ink-faint">
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
        {u.loading}
      </p>
    );
  if (lookup.status === "notfound")
    return (
      <p role="status" className="-mt-2 flex items-start gap-2 text-[0.95rem] text-level-partial">
        <CircleAlert aria-hidden className="mt-1 size-4 shrink-0" />
        {u.notFound}
      </p>
    );
  if (lookup.status !== "found") return null;
  const { unit } = lookup;
  return (
    <p
      role="status"
      className="-mt-2 flex items-start gap-2 rounded-soft bg-herb-soft px-3 py-2 text-[0.95rem] text-ink"
    >
      <CircleCheck aria-hidden className="mt-1 size-4 shrink-0 text-herb" />
      <span>
        <span className="font-semibold">{u.found}</span> {unit.name} ·{" "}
        {u.location(unit.tambon, unit.amphoe, unit.province)}
        {!unit.active && <span className="font-semibold text-danger"> · {u.inactive}</span>}
      </span>
    </p>
  );
}

type Reporter = Pick<ReportInput, (typeof REPORTER_FIELDS)[number]>;
type Errors = Partial<Record<ReportField, string>>;

const FIELD_ORDER: ReportField[] = [...REPORTER_FIELDS, "details"];
const f = th.report.fields;

function pickReporter(values: ReportInput): Reporter {
  return Object.fromEntries(REPORTER_FIELDS.map((k) => [k, values[k]])) as Reporter;
}

/**
 * Report form (US2). Builds the team's standard message in the browser. When the caller
 * copies it / opens LINE, the report is logged to the team's Google Sheet for follow-up
 * (see /api/log). Reporter details are remembered in this browser only when opted in.
 */
export function ReportForm({ topicTitle }: { topicTitle?: string }) {
  const stored = useLocalStorage<Reporter | null>(REPORTER_STORAGE_KEY, null);
  const [edits, setEdits] = useState<Partial<ReportInput>>({});
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [unit, setUnit] = useState<UnitLookup>({ status: "idle" });
  const lookupSeq = useRef(0);
  /** The name we filled in automatically; replaced on the next lookup unless the user edited it. */
  const autoName = useRef<string | null>(null);

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
    if (field === "unitCode") void lookupUnit(value);
  }

  /** Code removed/changed to an unknown one: drop the name we filled in (never a typed one). */
  function clearAutoName() {
    const filled = autoName.current;
    if (!filled) return;
    autoName.current = null;
    setEdits((e) => ((e.unitName ?? defaults.unitName) === filled ? { ...e, unitName: "" } : e));
  }

  /** 5-digit unit code → fill "ชื่อหน่วยงาน" from the MOPH registry (still editable). */
  async function lookupUnit(raw: string) {
    const seq = ++lookupSeq.current;
    const code = raw.replace(/\D/g, "");
    if (code.length !== 5) {
      clearAutoName();
      return setUnit({ status: "idle" });
    }
    setUnit({ status: "loading" });
    try {
      const res = await fetch(`/api/units/${code}`);
      if (seq !== lookupSeq.current) return; // a newer code was typed meanwhile
      if (!res.ok) {
        clearAutoName();
        return setUnit({ status: "notfound" });
      }
      const found = (await res.json()) as HealthUnit;
      setUnit({ status: "found", unit: found });
      setEdits((e) => {
        const current = e.unitName ?? defaults.unitName;
        if (current.trim() && current !== autoName.current) return e; // keep what the user typed
        autoName.current = found.name;
        return { ...e, unitName: found.name };
      });
      setErrors((errs) => ({ ...errs, unitName: undefined }));
    } catch {
      if (seq === lookupSeq.current) setUnit({ status: "idle" });
    }
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
      /** Suggestions shown as a dropdown; any other value can still be typed. */
      suggestions?: readonly string[];
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
          list={opts.suggestions ? `${field}-options` : undefined}
          value={values[field]}
          onChange={(e) => update(field, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
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

        <fieldset className="flex flex-col gap-4 rounded-soft border border-line bg-surface p-5 shadow-raise sm:p-6">
          <legend className="sr-only">{th.report.reporterSection}</legend>
          <div aria-hidden className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-herb-soft text-herb">
              <UserRound className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">
                <span className="text-herb">1.</span> {th.report.reporterSection}
              </p>
              <p className="text-[0.95rem] text-ink-faint">{th.report.reporterLead}</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {text("fullName", { autoComplete: "name" })}
            {text("position", {
              autoComplete: "off",
              hint: th.report.hints.position,
              suggestions: POSITIONS,
            })}
            <datalist id="position-options">
              {POSITIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            {text("unitCode", { hint: th.report.hints.unitCode, inputMode: "numeric" })}
            {text("unitName", { autoComplete: "organization" })}
          </div>
          <UnitStatus lookup={unit} />
          <div className="grid gap-4 sm:grid-cols-2">
            {text("phone", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
            {text("email", {
              optional: true,
              type: "email",
              inputMode: "email",
              autoComplete: "email",
            })}
          </div>
          {text("anydesk", { hint: th.report.hints.anydesk, inputMode: "numeric" })}
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

        <fieldset className="flex flex-col gap-4 rounded-soft border border-line bg-surface p-5 shadow-raise sm:p-6">
          <legend className="sr-only">{th.report.problemSection}</legend>
          <div aria-hidden className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-herb-soft text-herb">
              <MessageSquareText className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">
                <span className="text-herb">2.</span> {th.report.problemSection}
              </p>
              <p className="text-[0.95rem] text-ink-faint">{th.report.problemLead}</p>
            </div>
          </div>
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

        <Button type="submit" size="lg" className="self-start px-8">
          <Sparkles aria-hidden className="size-5" />
          {th.report.generate}
        </Button>
      </form>

      <div className="lg:sticky lg:top-24">
        {message ? (
          <MessagePreview message={message} report={values} />
        ) : (
          <MessagePreview message={formatReportDraft(values)} draft />
        )}
      </div>
    </div>
  );
}
