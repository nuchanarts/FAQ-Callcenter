import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdmin, OPEN_ACCESS_USER } from "@/auth/current-admin";
import { th } from "@/i18n/th";
import { SiteHeader } from "@/components/features/layout/site-header";
import { PATHNAME_HEADER } from "@/proxy";

export const dynamic = "force-dynamic";

/** Server-side gate for every admin page (the proxy redirect is only optimistic). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdmin();
  if (!admin) {
    const path = (await headers()).get(PATHNAME_HEADER) ?? "/admin";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-width py-10">
        {admin.id === OPEN_ACCESS_USER.id && (
          <p
            role="status"
            className="mb-6 rounded-soft border border-danger/40 bg-danger-soft px-4 py-3 font-semibold text-danger"
          >
            {th.auth.openAccessWarning}
          </p>
        )}
        {children}
      </main>
    </>
  );
}
