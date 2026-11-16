import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionUser } from "@/auth/session";
import { assertAdmin } from "@/domain/permissions";

/** The signed-in admin, or null for viewers (who never need to sign in). */
export async function getAdmin(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Server-side gate for every admin action and page (FR-012, Constitution VI). */
export async function requireAdmin(): Promise<SessionUser> {
  return assertAdmin(await getAdmin());
}
