"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOPIC_LIMITS, type SymptomImage } from "@/domain/topic";
import { th } from "@/i18n/th";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/images";
import { uploadImage } from "@/lib/upload-image";

const f = th.admin.form;

/** One screenshot of the problem, placed under the question field (shown in search results). */
export function SymptomImageEditor({
  value,
  onChange,
  imagesEnabled,
  error,
}: {
  value: SymptomImage | null;
  onChange: (value: SymptomImage | null) => void;
  /** Vercel Blob store connected: allow uploads. */
  imagesEnabled: boolean;
  error?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const captionId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (file.size > IMAGE_MAX_BYTES) return setUploadError(f.imageTooBig(file.name));
    setUploading(true);
    try {
      onChange({ url: await uploadImage(file), caption: value?.caption ?? "" });
    } catch {
      setUploadError(f.uploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const message = uploadError ?? error;

  return (
    <fieldset className="-mt-2 flex flex-col gap-2 rounded-soft border border-dashed border-line-strong bg-paper p-3">
      <legend className="sr-only">{f.symptomImage}</legend>
      <p className="text-[0.95rem] text-ink-faint">
        <span className="font-semibold text-ink">{f.symptomImage}</span> — {f.symptomImageHint}
      </p>
      {value && (
        <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of the uploaded image */}
          <img
            src={value.url}
            alt=""
            className="max-h-32 w-full rounded-soft border border-line bg-surface object-contain"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={captionId} className="font-semibold">
              {f.symptomCaption}
            </label>
            <Input
              id={captionId}
              maxLength={TOPIC_LIMITS.symptomCaption}
              value={value.caption}
              onChange={(e) => onChange({ ...value, caption: e.target.value })}
            />
          </div>
        </div>
      )}
      {message && (
        <p role="alert" className="font-medium text-danger">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {imagesEnabled ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              hidden
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <Button
              variant="secondary"
              size="sm"
              pending={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {value ? (
                <RefreshCw aria-hidden className="size-4" />
              ) : (
                <ImagePlus aria-hidden className="size-4" />
              )}
              {uploading ? f.uploading : value ? f.symptomImageReplace : f.symptomImageUpload}
            </Button>
          </>
        ) : (
          !value && <p className="text-[0.9rem] text-ink-faint">{f.symptomImageDisabled}</p>
        )}
        {/* Removing never needs the Blob store, so it works even when uploads are off. */}
        {value && (
          <Button variant="quiet-danger" size="sm" onClick={() => onChange(null)}>
            <X aria-hidden className="size-4" />
            {f.symptomImageRemove}
          </Button>
        )}
      </div>
    </fieldset>
  );
}
