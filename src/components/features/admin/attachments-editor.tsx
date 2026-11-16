"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { ATTACHMENT_KINDS, TOPIC_LIMITS, type Attachment } from "@/domain/topic";
import { th } from "@/i18n/th";

const f = th.admin.form;

interface AttachmentsEditorProps {
  value: Attachment[];
  errors: Record<string, string[] | undefined>;
  onChange: (next: Attachment[]) => void;
}

/** https-only links to clips, manuals, or pages (research R12: no uploads in the MVP). */
export function AttachmentsEditor({ value, errors, onChange }: AttachmentsEditorProps) {
  const update = (i: number, patch: Partial<Attachment>) =>
    onChange(value.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-semibold">{f.attachments}</legend>
      <p className="-mt-1 text-[0.95rem] text-ink-faint">{f.attachmentsHint}</p>
      {errors.attachments?.[0] && (
        <p className="font-medium text-danger">{errors.attachments[0]}</p>
      )}
      {value.map((a, i) => (
        <div
          key={i}
          className="grid gap-3 rounded-soft border border-line bg-paper p-3 sm:grid-cols-[9rem_1fr_1.4fr_auto] sm:items-start"
        >
          <Field label={f.attachmentKind} error={errors[`attachments.${i}.kind`]?.[0]}>
            {(p) => (
              <Select
                {...p}
                value={a.kind}
                onChange={(e) => update(i, { kind: e.target.value as Attachment["kind"] })}
              >
                {ATTACHMENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {th.topic.attachmentKinds[k]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.attachmentLabel} error={errors[`attachments.${i}.label`]?.[0]}>
            {(p) => (
              <Input
                {...p}
                maxLength={TOPIC_LIMITS.attachmentLabel}
                value={a.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            )}
          </Field>
          <Field label={f.attachmentUrl} error={errors[`attachments.${i}.url`]?.[0]}>
            {(p) => (
              <Input
                {...p}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={a.url}
                onChange={(e) => update(i, { url: e.target.value })}
              />
            )}
          </Field>
          <Button
            variant="quiet-danger"
            size="sm"
            className="sm:mt-8"
            aria-label={`${f.removeAttachment} ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < TOPIC_LIMITS.attachments && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => onChange([...value, { kind: "clip", label: "", url: "" }])}
        >
          <Plus aria-hidden className="size-4" />
          {f.addAttachment}
        </Button>
      )}
    </fieldset>
  );
}
