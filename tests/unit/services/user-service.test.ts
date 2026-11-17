import { beforeEach, describe, expect, it } from "vitest";
import { hashPasswordSync, verifyPassword } from "@/auth/password";
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

describe("user service", () => {
  it("only owners can list or change accounts", async () => {
    await expect(svc.listUsers(approver)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      svc.createUser(approver, {
        email: "a@b.c",
        displayName: "x",
        role: "author",
        password: "x".repeat(10),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("creates an account that can sign in, never exposing the hash", async () => {
    const created = await svc.createUser(owner, {
      email: " New@Example.org ",
      displayName: "ผู้เขียนใหม่",
      role: "author",
      password: "Strong#Pass1",
    });
    expect(created).toEqual({
      id: "u-1",
      email: "new@example.org",
      displayName: "ผู้เขียนใหม่",
      role: "author",
      active: true,
    });
    const list = await svc.listUsers(owner);
    expect(list.map((u) => u.email)).toContain("new@example.org");
    expect(JSON.stringify(list)).not.toContain("scrypt$");

    const user = await createAuthService({ admins }).signIn({
      email: "new@example.org",
      password: "Strong#Pass1",
    });
    expect(user.role).toBe("author");
  });

  it("rejects duplicate emails and short passwords as field errors", async () => {
    await expect(
      svc.createUser(owner, {
        email: "p@x.y",
        displayName: "x",
        role: "author",
        password: "Strong#Pass1",
      }),
    ).rejects.toMatchObject({ fieldErrors: { email: [expect.any(String)] } });
    await expect(
      svc.createUser(owner, {
        email: "z@x.y",
        displayName: "x",
        role: "author",
        password: "short",
      }),
    ).rejects.toMatchObject({ fieldErrors: { password: [expect.any(String)] } });
  });

  it("changes roles and disables accounts; disabled accounts cannot sign in", async () => {
    expect(await svc.updateUser(owner, { id: "p", role: "author" })).toMatchObject({
      role: "author",
    });
    await svc.updateUser(owner, { id: "p", active: false });
    await expect(
      createAuthService({ admins }).signIn({ email: "p@x.y", password: "Approve#2026" }),
    ).rejects.toBeInstanceOf(ValidationError);
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

  it("resets a password", async () => {
    await svc.resetPassword(owner, { id: "p", password: "Brand#New2026" });
    const stored = await admins.findByEmail("p@x.y");
    expect(await verifyPassword("Brand#New2026", stored!.passwordHash)).toBe(true);
  });
});
