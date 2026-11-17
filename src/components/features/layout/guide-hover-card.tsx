"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ListOrdered,
  MessageSquareWarning,
  Search,
  Sparkles,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { th } from "@/i18n/th";

const g = th.guide;
const STEP_ICONS = [Sparkles, Search, BadgeCheck, ListOrdered, MessageSquareWarning];

/**
 * Floating "how to use" panel shown while the mouse rests on the guide icon in the header,
 * so viewers can read the guide without leaving the page they are on.
 */
export function GuideHoverCard({ id }: { id: string }) {
  return (
    <div
      id={id}
      role="dialog"
      aria-label={g.title}
      className="absolute top-full right-0 z-50 w-[min(30rem,calc(100vw-2rem))] pt-2"
    >
      <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-soft border border-line bg-surface p-5 shadow-raise">
        <div className="mb-3">
          <p className="font-display text-xl font-bold text-ink">{g.title}</p>
          <p className="text-[0.95rem] text-ink-faint">
            {g.subtitle} · {g.viewerTitle}
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {g.viewerSteps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Sparkles;
            return (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-herb-soft text-herb">
                  <Icon aria-hidden className="size-[1.1rem]" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    <span className="text-herb">{i + 1}.</span> {step.title}
                  </p>
                  <p className="text-[0.93rem] leading-[1.6] text-ink-muted">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-soft bg-surface-muted px-3 py-2 text-[0.9rem] text-ink-muted">
          {g.shortcuts.map((s) => (
            <span key={s.action} className="flex items-center gap-1.5">
              {s.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
              {s.action}
            </span>
          ))}
        </div>

        <Link
          href="/guide"
          className="mt-4 flex items-center justify-end gap-1 text-[0.95rem] font-semibold text-herb hover:underline"
        >
          {g.openFull}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  );
}
