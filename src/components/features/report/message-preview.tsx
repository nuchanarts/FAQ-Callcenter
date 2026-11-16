"use client";

import { useRef } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { th } from "@/i18n/th";

/** The generated message as a perforated paper slip, ready to copy. */
export function MessagePreview({ message }: { message: string }) {
  const textRef = useRef<HTMLPreElement>(null);
  return (
    <section
      aria-labelledby="preview-title"
      className="overflow-hidden rounded-soft border border-line bg-surface shadow-raise"
    >
      <div className="perforated h-2.5 bg-herb" aria-hidden="true" />
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 id="preview-title" className="text-xl font-semibold">
            {th.report.previewTitle}
          </h2>
          <p className="text-[0.95rem] text-ink-faint">{th.report.previewHint}</p>
        </div>
        <pre
          ref={textRef}
          data-testid="report-message"
          className="rounded-soft border border-dashed border-line-strong bg-paper p-4 font-sans text-[0.98rem] leading-relaxed whitespace-pre-wrap text-ink"
        >
          {message}
        </pre>
        <CopyButton text={message} label={th.report.copy} size="lg" fallbackTarget={textRef} />
      </div>
    </section>
  );
}
