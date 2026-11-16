"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

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
