"use client";

import { useRef } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

interface MessagePreviewProps {
  message: string;
  /** Live, not-yet-validated preview: muted styling and no copy button. */
  draft?: boolean;
}

/** The message as a perforated paper slip: a live draft while typing, then ready to copy. */
export function MessagePreview({ message, draft = false }: MessagePreviewProps) {
  const textRef = useRef<HTMLPreElement>(null);
  return (
    <section
      aria-labelledby="preview-title"
      className={cn(
        "overflow-hidden rounded-soft border bg-surface",
        draft ? "border-dashed border-line-strong" : "border-line shadow-raise",
      )}
    >
      <div
        className={cn("perforated h-2.5", draft ? "bg-line-strong" : "bg-herb")}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 id="preview-title" className="text-xl font-semibold">
            {draft ? th.report.draftTitle : th.report.previewTitle}
          </h2>
          <p className="text-[0.95rem] text-ink-faint">
            {draft ? th.report.draftHint : th.report.previewHint}
          </p>
        </div>
        <pre
          ref={textRef}
          data-testid={draft ? "report-draft" : "report-message"}
          className={cn(
            "rounded-soft border border-dashed border-line-strong bg-paper p-4 font-sans text-[0.98rem] leading-relaxed whitespace-pre-wrap",
            draft ? "text-ink-muted" : "text-ink",
          )}
        >
          {message}
        </pre>
        {!draft && (
          <CopyButton text={message} label={th.report.copy} size="lg" fallbackTarget={textRef} />
        )}
      </div>
    </section>
  );
}
