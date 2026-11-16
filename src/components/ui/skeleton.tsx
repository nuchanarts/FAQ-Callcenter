import { th } from "@/i18n/th";

/** Shared loading state for data views (FR-022): one polite status, placeholder rows hidden from AT. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10"
    >
      <span className="sr-only">{th.common.loading}</span>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-soft bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
