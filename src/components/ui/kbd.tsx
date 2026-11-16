import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-b-2 border-line-strong bg-surface px-1.5 font-sans text-[0.85rem] font-semibold text-ink-muted">
      {children}
    </kbd>
  );
}
