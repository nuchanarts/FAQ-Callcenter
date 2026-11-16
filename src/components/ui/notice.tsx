import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface NoticeProps {
  title: string;
  children?: ReactNode;
  tone?: "info" | "warning";
  className?: string;
}

export function Notice({ title, children, tone = "info", className }: NoticeProps) {
  const isInfo = tone === "info";
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-soft border px-4 py-3 text-ink",
        isInfo
          ? "border-level-team/30 bg-level-team-soft"
          : "border-level-partial/30 bg-level-partial-soft",
        className,
      )}
    >
      <Info
        aria-hidden
        className={cn("mt-1 size-5 shrink-0", isInfo ? "text-level-team" : "text-level-partial")}
      />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="text-ink-muted">{children}</div>}
      </div>
    </div>
  );
}
