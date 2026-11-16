import type { LucideIcon } from "lucide-react";

interface Step {
  title: string;
  body: string;
}

/** Numbered how-to steps (a real sequence, so numbers carry meaning). */
export function GuideSteps({ steps, icons }: { steps: readonly Step[]; icons: LucideIcon[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const Icon = icons[i];
        return (
          <li
            key={step.title}
            className="flex gap-4 rounded-soft border border-line bg-surface p-4 sm:p-5"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-herb-soft font-display text-lg font-bold text-herb">
                {i + 1}
              </span>
              {Icon && <Icon aria-hidden className="size-5 text-ink-faint" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-ink-muted">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
