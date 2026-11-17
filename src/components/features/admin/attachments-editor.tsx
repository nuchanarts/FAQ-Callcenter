"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { ATTACHMENT_KINDS, TOPIC_LIMITS, type Attachment } from "@/domain/topic";
import { th } from "@/i18n/th";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/images";

const f = th.admin.form;

interface AttachmentsEditorProps {
  value: Attachment[];
  errors: Record<string, string[] | undefined>;
  onChange: (next: Attachment[]) => void;
  /** Vercel Blob store connected: show the image upload button. */
  imagesEnabled?: boolean;
}

/** https-only links to clips, manuals, pages — and uploaded images (Vercel Blob). */
export function AttachmentsEditor({
  value,
  errors,
  onChange,
  imagesEnabled = false,
}: AttachmentsEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const update = (i: number, patch: Partial<Attachment>) =>
    onChange(value.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    const room = TOPIC_LIMITS.attachments - value.length;
    const picked = [...files].slice(0, room);
    const tooBig = picked.find((f) => f.size > IMAGE_MAX_BYTES);
    if (tooBig) return setUploadError(f.imageTooBig(tooBig.name));
    setUploading(true);
    try {
      const added: Attachment[] = [];
      for (const file of picked) {
        const blob = await upload(`faq/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        added.push({ kind: "image", label: file.name.replace(/.[^.]+$/, ""), url: blob.url });
      }
      onChange([...value, ...added]);
    } catch {
      setUploadError(f.uploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
          {a.kind === "image" && a.url && (
            // eslint-disable-next-line @next/next/no-img-element -- preview of the uploaded image
            <img
              src={a.url}
              alt=""
              className="max-h-40 rounded-soft border border-line bg-surface object-contain sm:col-span-4"
            />
          )}
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
      {uploadError && (
        <p role="alert" className="font-medium text-danger">
          {uploadError}
        </p>
      )}
      {value.length < TOPIC_LIMITS.attachments && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange([...value, { kind: "clip", label: "", url: "" }])}
          >
            <Plus aria-hidden className="size-4" />
            {f.addAttachment}
          </Button>
          {imagesEnabled ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                multiple
                hidden
                onChange={(e) => void onFiles(e.target.files)}
              />
              <Button
                variant="secondary"
                size="sm"
                pending={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus aria-hidden className="size-4" />
                {uploading ? f.uploading : f.uploadImage}
              </Button>
              <span className="text-[0.9rem] text-ink-faint">{f.uploadHint}</span>
            </>
          ) : (
            <span className="text-[0.9rem] text-ink-faint">{f.uploadDisabled}</span>
          )}
        </div>
      )}
    </fieldset>
  );
}
