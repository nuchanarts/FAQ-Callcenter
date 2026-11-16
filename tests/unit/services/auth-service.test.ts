import { describe, expect, it } from "vitest";
import { createAuthService, safeNextPath } from "@/services/auth-service";
import { createMemoryRepositories } from "@/repositories/memory";
import { hashPasswordSync } from "@/auth/password";
import { ValidationError } from "@/domain/errors";

const repos = createMemoryRepositories({
  admins: [
    {
      id: "a1",
      email: "admin@bgs.local",
      displayName: "ผู้ดูแล",
      role: "owner",
      passwordHash: hashPasswordSync("Admin#2026"),
    },
  ],
});
const auth = createAuthService({ admins: repos.admins });

describe("auth service", () => {
  it("signs in with correct credentials (email case-insensitive)", async () => {
    await expect(
      auth.signIn({ email: " ADMIN@bgs.local ", password: "Admin#2026" }),
    ).resolves.toEqual({
      id: "a1",
      email: "admin@bgs.local",
      displayName: "ผู้ดูแล",
      role: "owner",
    });
  });

  it("gives the same generic error for wrong password and unknown email", async () => {
    const attempts = [
      { email: "admin@bgs.local", password: "nope" },
      { email: "who@bgs.local", password: "Admin#2026" },
    ];
    for (const input of attempts) {
      const error = await auth.signIn(input).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchObject({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
  });

  it("validates required fields", async () => {
    await expect(auth.signIn({ email: "", password: "" })).rejects.toMatchObject({
      fieldErrors: { email: expect.any(Array), password: expect.any(Array) },
    });
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/topics/b-1?x=1", "/admin/topics/b-1?x=1"],
    ["//evil.com", "/admin"],
    ["https://evil.com", "/admin"],
    ["/\\evil.com", "/admin"],
    [undefined, "/admin"],
    ["", "/admin"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
