import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SessionUser } from "@/auth/session";
import { ConflictError, NotFoundError, ValidationError } from "@/domain/errors";
import { ADMIN_ROLES, assertCanManageUsers, type AdminRole } from "@/domain/permissions";
import { parseOrThrow } from "@/domain/validation";
import { th } from "@/i18n/th";
import type { AdminUserRecord, AdminUserRepository } from "@/repositories/types";

/** What the users page sees — never the password hash. */
export interface AdminUserView {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
}

const v = th.validation;
const u = th.users;

const email = z.string().trim().toLowerCase().min(1, v.required).max(200).email(v.email);
const displayName = z.string().trim().min(1, v.required).max(80, v.tooLong(80));
const role = z.enum(ADMIN_ROLES);
const createSchema = z.object({ email, displayName, role });
const updateSchema = z.object({
  id: z.string().min(1).max(100),
  displayName: displayName.optional(),
  role: role.optional(),
  active: z.boolean().optional(),
});

const toView = ({ passwordHash: _hash, ...rest }: AdminUserRecord): AdminUserView => rest;

/**
 * Admin account management (owner only, Constitution VI). Staff sign in with Google, so an
 * account is just a granted Gmail address + name + role; no password is stored.
 */
export function createUserService(deps: { admins: AdminUserRepository; newId?: () => string }) {
  const newId = deps.newId ?? (() => `u-${randomUUID()}`);

  async function load(id: string): Promise<{ all: AdminUserRecord[]; user: AdminUserRecord }> {
    const all = await deps.admins.list();
    const user = all.find((a) => a.id === id);
    if (!user) throw new NotFoundError("user");
    return { all, user };
  }

  async function save(record: AdminUserRecord): Promise<AdminUserView> {
    try {
      return toView(await deps.admins.upsert(record));
    } catch (err) {
      if (err instanceof ConflictError) {
        throw new ValidationError(u.emailTaken, { email: [u.emailTaken] });
      }
      throw err;
    }
  }

  async function listUsers(actor: SessionUser | null): Promise<AdminUserView[]> {
    assertCanManageUsers(actor);
    const all = await deps.admins.list();
    return all.map(toView).sort((a, b) => a.email.localeCompare(b.email));
  }

  async function createUser(actor: SessionUser | null, input: unknown): Promise<AdminUserView> {
    assertCanManageUsers(actor);
    const data = parseOrThrow(createSchema, input);
    return save({
      id: newId(),
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      passwordHash: "",
      active: true,
    });
  }

  async function updateUser(actor: SessionUser | null, input: unknown): Promise<AdminUserView> {
    const me = assertCanManageUsers(actor);
    const data = parseOrThrow(updateSchema, input);
    const { all, user } = await load(data.id);
    const next: AdminUserRecord = {
      ...user,
      displayName: data.displayName ?? user.displayName,
      role: data.role ?? user.role,
      active: data.active ?? user.active,
    };
    // No locking yourself out, and never leave the system without an active owner.
    if (user.id === me.id && (next.role !== user.role || !next.active)) {
      throw new ValidationError(u.notSelf);
    }
    const ownersLeft = all.filter((a) =>
      a.id === next.id ? next.role === "owner" && next.active : a.role === "owner" && a.active,
    ).length;
    if (ownersLeft === 0) throw new ValidationError(u.lastOwner);
    return save(next);
  }

  return { listUsers, createUser, updateUser };
}

export type UserService = ReturnType<typeof createUserService>;
