import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/auth/password";

describe("password hashing", () => {
  it("verifies the correct password and rejects others", async () => {
    const hash = await hashPassword("Admin#2026");
    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(await verifyPassword("Admin#2026", hash)).toBe(true);
    expect(await verifyPassword("admin#2026", hash)).toBe(false);
  });
  it("uses a random salt", async () => {
    expect(await hashPassword("x")).not.toBe(await hashPassword("x"));
  });
  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
    expect(await verifyPassword("x", "scrypt$zz$00")).toBe(false);
  });
});
