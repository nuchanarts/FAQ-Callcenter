import Link from "next/link";
import { LifeBuoy, LockKeyhole, LogOut } from "lucide-react";
import { getAdmin } from "@/auth/current-admin";
import { signOutAction } from "@/app/actions/auth-actions";
import { NavLinks } from "@/components/features/layout/nav-links";
import { SkinPicker } from "@/components/features/layout/skin-picker";
import { th } from "@/i18n/th";

export async function SiteHeader() {
  const admin = await getAdmin();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <nav
        aria-label={th.nav.menu}
        className="page-width flex h-16 items-center justify-between gap-2"
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
          <SkinPicker />
          {!admin && (
            // Staff entry point to content management (viewers never need to sign in).
            <Link
              href="/login"
              title={th.nav.staffLogin}
              className="flex h-10 items-center gap-1.5 rounded-soft px-2.5 text-[0.95rem] font-semibold text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <LockKeyhole aria-hidden className="size-[1.1rem]" />
              <span className="max-lg:sr-only">{th.nav.staffLoginShort}</span>
            </Link>
          )}
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
