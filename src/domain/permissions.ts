import { ForbiddenError, UnauthorizedError } from "@/domain/errors";

/**
 * Admin roles (Constitution VI):
 * - owner    ผู้ดูแลระบบ — everything, plus managing admin accounts and roles
 * - approver ผู้อนุมัติ   — edit + publish directly, approve/reject drafts, hide/restore/delete
 * - author   ผู้เขียน     — write drafts only; viewers see nothing until an approver publishes
 */
export const ADMIN_ROLES = ["owner", "approver", "author"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Roles stored before the 3-level model; read as their current equivalent. */
const LEGACY_ROLES: Record<string, AdminRole> = { editor: "approver" };

/** Parse a stored/session role (accepting legacy names); null when unknown. */
export function toRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") return null;
  if ((ADMIN_ROLES as readonly string[]).includes(value)) return value as AdminRole;
  return LEGACY_ROLES[value] ?? null;
}

type WithRole = { role: string } | null | undefined;

export function canManageContent(user: WithRole): boolean {
  return !!user && toRole(user.role) !== null;
}

/** Publish, approve/reject drafts, hide, restore, delete. */
export function canPublish(user: WithRole): boolean {
  const role = user ? toRole(user.role) : null;
  return role === "owner" || role === "approver";
}

/** Add/disable admin accounts and change roles. */
export function canManageUsers(user: WithRole): boolean {
  return !!user && toRole(user.role) === "owner";
}

/** Throws unless the user is a signed-in admin; returns the user for chaining. */
export function assertAdmin<U extends { role: string }>(user: U | null | undefined): U {
  if (!user) throw new UnauthorizedError();
  if (!canManageContent(user)) throw new ForbiddenError();
  return user;
}

export function assertCanPublish<U extends { role: string }>(user: U | null | undefined): U {
  const u = assertAdmin(user);
  if (!canPublish(u)) throw new ForbiddenError();
  return u;
}

export function assertCanManageUsers<U extends { role: string }>(user: U | null | undefined): U {
  const u = assertAdmin(user);
  if (!canManageUsers(u)) throw new ForbiddenError();
  return u;
}
