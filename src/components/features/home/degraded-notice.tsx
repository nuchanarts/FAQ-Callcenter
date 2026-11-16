import { Notice } from "@/components/ui/notice";
import { th } from "@/i18n/th";

/** Shown when the store is down and only built-in topics are served (FR-019). */
export function DegradedNotice() {
  return (
    <Notice tone="warning" title={th.degraded.title}>
      {th.degraded.body}
    </Notice>
  );
}
