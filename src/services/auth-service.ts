import { z } from "zod";
import { verifyPassword } from "@/auth/password";
import type { SessionUser } from "@/auth/session";
import { ValidationError } from "@/domain/errors";
import { parseOrThrow } from "@/domain/validation";
import { th } from "@/i18n/th";
import type { AdminUserRepository } from "@/repositories/types";

const signInSchema = z.object({
  email: z.string().trim().min(1, th.validation.required).max(200),
  password: z.string().min(1, th.validation.required).max(200),
});

const DEFAULT_NEXT = "/admin";

/** Only allow same-origin relative paths after sign-in (open-redirect protection). */
export function safeNextPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_NEXT;
  }
  return next;
}

export function createAuthService(deps: { admins: AdminUserRepository }) {
  async function signIn(input: { email: string; password: string }): Promise<SessionUser> {
    const { email, password } = parseOrThrow(signInSchema, input);
    const user = await deps.admins.findByEmail(email);
    // Always run a hash check so response time does not reveal whether the email exists.
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !user.active) throw new ValidationError(th.auth.invalid);
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  }
  return { signIn };
}

const DUMMY_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);
