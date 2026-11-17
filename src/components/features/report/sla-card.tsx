import { Clock3, MailCheck } from "lucide-react";
import { th } from "@/i18n/th";

/** Response promise shown on the report page: reply within 24 hours on business days. */
export function SlaCard() {
  return (
    <aside
      aria-label={th.report.sla.title}
      className="flex items-start gap-4 rounded-soft border border-herb/30 bg-herb-soft px-5 py-4"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-herb text-on-herb">
        <Clock3 aria-hidden className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
          {th.report.sla.title}
          <span className="rounded-pill bg-surface px-2.5 py-0.5 text-[0.85rem] text-herb">
            {th.report.sla.badge}
          </span>
        </p>
        <p className="mt-1 text-ink-muted">{th.report.sla.body}</p>
      </div>
    </aside>
  );
}

/** Short reassurance placed right under the copy button of the finished message. */
export function SlaAfterCopy() {
  return (
    <p className="flex items-start gap-2 rounded-soft bg-herb-soft px-4 py-3 text-[0.95rem] text-ink">
      <MailCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-herb" />
      <span>{th.report.sla.afterCopy}</span>
    </p>
  );
}
