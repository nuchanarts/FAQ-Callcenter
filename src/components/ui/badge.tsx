import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "self" | "partial" | "team" | "neutral" | "herb" | "danger";

const TONES: Record<BadgeTone, string> = {
  self: "bg-level-self-soft text-level-self",
  partial: "bg-level-partial-soft text-level-partial",
  team: "bg-level-team-soft text-level-team",
  neutral: "bg-surface-muted text-ink-muted",
  herb: "bg-herb-soft text-herb",
  danger: "bg-danger-soft text-danger",
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[0.9rem] leading-6 font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
