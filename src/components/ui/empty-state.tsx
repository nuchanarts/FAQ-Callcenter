import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: ReactNode;
}

export function EmptyState({ title, body, actionLabel, onAction, secondary }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-soft border border-dashed border-line-strong bg-surface px-6 py-8">
      <SearchX aria-hidden className="size-8 text-ink-faint" />
      <div>
        <p className="font-display text-lg font-semibold">{title}</p>
        {body && <p className="text-ink-muted">{body}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {actionLabel && onAction && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondary}
      </div>
    </div>
  );
}
