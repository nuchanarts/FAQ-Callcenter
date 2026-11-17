import { beforeEach, describe, expect, it } from "vitest";
import { hashPasswordSync } from "@/auth/password";
import type { SessionUser } from "@/auth/session";
import { ForbiddenError, ValidationError } from "@/domain/errors";
import { createMemoryRepositories } from "@/repositories/memory";
import type { AdminUserRepository } from "@/repositories/types";
import { createAuthService } from "@/services/auth-service";
import { createUserService, type UserService } from "@/services/user-service";

const owner: SessionUser = { id: "o", email: "owner@x.y", displayName: "เจ้าของ", role: "owner" };
const approver: SessionUser = { id: "p", email: "p@x.y", displayName: "อนุมัติ", role: "approver" };

let admins: AdminUserRepository;
let svc: UserService;
let ids = 0;
beforeEach(() => {
  ids = 0;
  admins = createMemoryRepositories({
    admins: [
      { ...owner, passwordHash: hashPasswordSync("Owner#2026xx"), active: true },
      { ...approver, passwordHash: hashPasswordSync("Approve#2026"), active: true },
    ],
  }).admins;
  svc = createUserService({ admins, newId: () => `u-${++ids}` });
});

/** Google verifier stub: the credential *is* the verified email. */
const google = (a: AdminUserRepository) =>
  createAuthService({ admins: a, verifyGoogle: async (c) => c || null });

describe("user service", () => {
  it("only owners can list or change accounts", async () => {
    await expect(svc.listUsers(approver)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      svc.createUser(approver, { email: "a@b.c", displayName: "x", role: "author" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("grants a Gmail account that can then sign in with Google (no password stored)", async () => {
    const created = await svc.createUser(owner, {
      email: " New.Staff@Gmail.com ",
      displayName: "ผู้เขียนใหม่",
      role: "author",
    });
    expect(created).toEqual({
      id: "u-1",
      email: "new.staff@gmail.com",
      displayName: "ผู้เขียนใหม่",
      role: "author",
      active: true,
    });
    expect((await admins.findByEmail("new.staff@gmail.com"))?.passwordHash).toBe("");
    expect(JSON.stringify(await svc.listUsers(owner))).not.toContain("scrypt$");

    const user = await google(admins).signInWithGoogle("new.staff@gmail.com");
    expect(user).toMatchObject({ role: "author", email: "new.staff@gmail.com" });
    // A granted-by-Google account has no password: password login never matches.
    await expect(
      createAuthService({ admins }).signIn({ email: "new.staff@gmail.com", password: "x" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects duplicate emails and invalid emails as field errors", async () => {
    await expect(
      svc.createUser(owner, { email: "p@x.y", displayName: "x", role: "author" }),
    ).rejects.toMatchObject({ fieldErrors: { email: [expect.any(String)] } });
    await expect(
      svc.createUser(owner, { email: "not-an-email", displayName: "x", role: "author" }),
    ).rejects.toMatchObject({ fieldErrors: { email: [expect.any(String)] } });
  });

  it("changes roles and disables accounts; disabled accounts cannot sign in", async () => {
    expect(await svc.updateUser(owner, { id: "p", role: "author" })).toMatchObject({
      role: "author",
    });
    await svc.updateUser(owner, { id: "p", active: false });
    await expect(google(admins).signInWithGoogle("p@x.y")).rejects.toBeInstanceOf(ValidationError);
  });

  it("owners cannot demote or disable themselves, and one active owner must remain", async () => {
    await expect(svc.updateUser(owner, { id: "o", role: "author" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(svc.updateUser(owner, { id: "o", active: false })).rejects.toBeInstanceOf(
      ValidationError,
    );
    // Promote p to owner, then p demotes o → still one owner (p): allowed.
    await svc.updateUser(owner, { id: "p", role: "owner" });
    const p: SessionUser = { ...approver, role: "owner" };
    expect(await svc.updateUser(p, { id: "o", role: "approver" })).toMatchObject({
      role: "approver",
    });
  });
});

describe("Google sign-in", () => {
  it("refuses Gmail accounts that are not on the staff list", async () => {
    await expect(google(admins).signInWithGoogle("stranger@gmail.com")).rejects.toMatchObject({
      message: expect.stringContaining("stranger@gmail.com"),
    });
  });

  it("refuses when Google can't verify the token", async () => {
    await expect(google(admins).signInWithGoogle("")).rejects.toBeInstanceOf(ValidationError);
  });
});
