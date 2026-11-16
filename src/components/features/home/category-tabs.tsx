"use client";

import { CATEGORIES, type CategoryId } from "@/domain/categories";
import { CategoryIcon } from "@/components/features/topic/category-icon";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

interface CategoryTabsProps {
  value: CategoryId | null;
  counts: Record<CategoryId, number>;
  total: number;
  onChange: (value: CategoryId | null) => void;
}

function Chip({
  pressed,
  onClick,
  children,
  count,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-pill border px-3.5 text-[0.95rem] font-semibold whitespace-nowrap transition-colors",
        pressed
          ? "border-herb bg-herb text-on-herb"
          : "border-line-strong bg-surface text-ink-muted hover:border-herb hover:text-herb",
        count === 0 && !pressed && "opacity-60",
      )}
    >
      {children}
      <span
        className={cn(
          "min-w-6 rounded-pill px-1.5 text-center text-[0.85rem] tabular-nums",
          pressed ? "bg-herb-strong" : "bg-surface-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/** The 8 fixed categories as filter chips with live counts (FR-003). Scrolls sideways on phones. */
export function CategoryTabs({ value, counts, total, onChange }: CategoryTabsProps) {
  return (
    <div
      role="group"
      aria-label={th.categories.label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      <Chip pressed={value === null} onClick={() => onChange(null)} count={total}>
        {th.categories.all}
      </Chip>
      {CATEGORIES.map((c) => (
        <Chip
          key={c.id}
          pressed={value === c.id}
          onClick={() => onChange(value === c.id ? null : c.id)}
          count={counts[c.id]}
        >
          <CategoryIcon name={c.icon} />
          {c.name}
        </Chip>
      ))}
    </div>
  );
}
