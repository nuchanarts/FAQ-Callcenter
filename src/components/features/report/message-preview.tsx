"use client";

import { useRef, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { LineOpenButton, LineSteps } from "@/components/features/report/line-handoff";
import { SlaAfterCopy } from "@/components/features/report/sla-card";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";
import { logEvent } from "@/lib/log-event";

interface MessagePreviewProps {
  message: string;
  /** Live, not-yet-validated preview: muted styling and no copy button. */
  draft?: boolean;
  /** The validated form values behind `message`; logged once when it is copied or sent. */
  report?: Record<string, string>;
  /** The topic the report was started from, counted with the report. */
  topicId?: string;
}

/** The message as a perforated paper slip: a live draft while typing, then ready to copy. */
export function MessagePreview({ message, draft = false, report, topicId }: MessagePreviewProps) {
  const textRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const loggedRef = useRef<string | null>(null);
  const markCopied = (channel: "line" | "copy") => {
    setCopied(true);
    // One Sheet row per finished message, however many times it is copied.
    if (report && loggedRef.current !== message) {
      loggedRef.current = message;
      logEvent({ kind: "report", channel, report, ...(topicId ? { topicId } : {}) });
    }
  };
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
        {!draft && copied && <LineSteps />}
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
          <>
            <div className="flex flex-col gap-3">
              <LineOpenButton
                message={message}
                fallbackTarget={textRef}
                onCopied={() => markCopied("line")}
              />
              <CopyButton
                text={message}
                label={th.report.copy}
                size="lg"
                variant="secondary"
                fallbackTarget={textRef}
                onCopied={() => markCopied("copy")}
              />
            </div>
            <SlaAfterCopy />
          </>
        )}
      </div>
    </section>
  );
}
