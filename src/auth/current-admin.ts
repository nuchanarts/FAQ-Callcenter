import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionUser } from "@/auth/session";
import { assertAdmin } from "@/domain/permissions";
import { th } from "@/i18n/th";
import { getConfig } from "@/lib/config";
import { getRepositories } from "@/repositories";

/** Who every visitor is while OPEN_ADMIN_ACCESS=true (temporary, before sign-in is set up). */
export const OPEN_ACCESS_USER: SessionUser = {
  id: "open-access",
  email: "open-access@local",
  displayName: th.auth.openAccessName,
  role: "owner",
};

/**
 * The signed-in admin, or null for viewers (who never need to sign in).
 * The signed cookie is re-checked against the admin store on every request, so removing
 * an admin (or changing their role) takes effect immediately instead of after 8 hours.
 */
export async function getAdmin(): Promise<SessionUser | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return getConfig().openAdminAccess ? OPEN_ACCESS_USER : null;
  try {
    const account = await getRepositories().admins.findByEmail(session.email);
    if (!account || account.id !== session.id || !account.active) return null;
    return {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
    };
  } catch (err) {
    console.error("[auth] admin lookup failed; treating as signed out", err);
    return null;
  }
}

/** Server-side gate for every admin action and page (FR-012, Constitution VI). */
export async function requireAdmin(): Promise<SessionUser> {
  return assertAdmin(await getAdmin());
}
