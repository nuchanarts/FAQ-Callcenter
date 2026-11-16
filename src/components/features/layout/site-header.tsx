import Link from "next/link";
import { LifeBuoy, LogOut } from "lucide-react";
import { getAdmin } from "@/auth/current-admin";
import { signOutAction } from "@/app/actions/auth-actions";
import { NavLinks } from "@/components/features/layout/nav-links";
import { th } from "@/i18n/th";

export async function SiteHeader() {
  const admin = await getAdmin();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <nav
        aria-label={th.nav.menu}
        className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-soft font-display text-lg font-bold text-ink"
        >
          <span className="flex size-9 items-center justify-center rounded-soft bg-herb text-on-herb">
            <LifeBuoy aria-hidden className="size-5" />
          </span>
          <span className="max-md:sr-only">{th.app.shortName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <NavLinks isAdmin={!!admin} />
          {admin && (
            <form action={signOutAction}>
              <button
                type="submit"
                title={th.auth.signedInAs(admin.displayName)}
                className="flex size-10 items-center justify-center rounded-soft text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <LogOut aria-hidden className="size-5" />
                <span className="sr-only">{th.nav.signOut}</span>
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}
