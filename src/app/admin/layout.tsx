import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdmin } from "@/auth/current-admin";
import { SiteHeader } from "@/components/features/layout/site-header";

export const dynamic = "force-dynamic";

/** Server-side gate for every admin page (the proxy redirect is only optimistic). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await getAdmin())) redirect("/login?next=/admin");
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        {children}
      </main>
    </>
  );
}
