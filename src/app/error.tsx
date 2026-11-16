"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { th } from "@/i18n/th";

/** Consistent error state (FR-022): explains what to do next, offers retry and a way home. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-20">
      <AlertTriangle aria-hidden className="size-10 text-level-partial" />
      <h1 className="text-3xl font-bold">{th.errors.pageTitle}</h1>
      <p className="text-ink-muted">{th.errors.unexpected}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={reset}>
          <RefreshCw aria-hidden className="size-5" />
          {th.errors.retry}
        </Button>
        <Link href="/" className={buttonClass("secondary")}>
          {th.errors.backHome}
        </Link>
        <Link href="/report" className={buttonClass("ghost")}>
          {th.nav.report}
        </Link>
      </div>
    </main>
  );
}
