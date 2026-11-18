"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logEvent } from "@/lib/log-event";

export const VISIT_KEY = "bgs-visit-logged";

/** Counts one site visit per browser session (staff pages and sign-in are not visits). */
export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;
    try {
      if (sessionStorage.getItem(VISIT_KEY)) return;
      sessionStorage.setItem(VISIT_KEY, "1");
    } catch {
      return; // storage blocked: skip rather than count every page view
    }
    logEvent({ kind: "visit" });
  }, [pathname]);
  return null;
}
