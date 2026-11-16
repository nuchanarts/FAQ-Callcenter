import { ForbiddenError, UnauthorizedError } from "@/domain/errors";

/** Admin roles (Constitution VI). Owner and Editor have the same content rights in the MVP. */
export const ADMIN_ROLES = ["owner", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function canManageContent(user: { role: string } | null | undefined): boolean {
  return !!user && (ADMIN_ROLES as readonly string[]).includes(user.role);
}

/** Throws unless the user is a signed-in admin; returns the user for chaining. */
export function assertAdmin<U extends { role: string }>(user: U | null | undefined): U {
  if (!user) throw new UnauthorizedError();
  if (!canManageContent(user)) throw new ForbiddenError();
  return user;
}
