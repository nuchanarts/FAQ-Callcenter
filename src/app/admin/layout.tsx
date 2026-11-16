import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdmin } from "@/auth/current-admin";
import { SiteHeader } from "@/components/features/layout/site-header";
import { PATHNAME_HEADER } from "@/proxy";

export const dynamic = "force-dynamic";

/** Server-side gate for every admin page (the proxy redirect is only optimistic). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await getAdmin())) {
    const path = (await headers()).get(PATHNAME_HEADER) ?? "/admin";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {children}
      </main>
    </>
  );
}
