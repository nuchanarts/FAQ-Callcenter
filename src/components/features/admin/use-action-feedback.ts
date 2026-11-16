"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { ErrorCode } from "@/domain/errors";
import type { ActionResult } from "@/lib/action-result";

const STALE_CODES = new Set<ErrorCode>(["conflict", "not_found"]);

/**
 * Shared "run a server action → toast → refresh" flow for admin screens (Constitution XIII).
 * Returns the result so callers can react to field errors or conflicts.
 */
export function useActionFeedback() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T>(action: () => Promise<ActionResult<T>>, successMessage: string) => {
      setPending(true);
      try {
        const result = await action();
        if (result.ok) {
          toast.show(successMessage);
          router.refresh();
        } else {
          toast.show(result.error.message, "error");
          // Data changed under us: reload so the next attempt uses current versions.
          if (STALE_CODES.has(result.error.code)) router.refresh();
        }
        return result;
      } finally {
        setPending(false);
      }
    },
    [router, toast],
  );

  return { run, pending };
}
