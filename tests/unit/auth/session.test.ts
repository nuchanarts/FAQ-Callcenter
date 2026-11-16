import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signSession, verifySession, SESSION_MAX_AGE_SECONDS } from "@/auth/session";

const user = { id: "1", email: "admin@bgs.local", displayName: "ผู้ดูแล", role: "owner" as const };

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession(user);
    expect(await verifySession(token)).toEqual(user);
  });
  it("rejects tampered, foreign and empty tokens", async () => {
    const token = await signSession(user);
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    const foreign = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("another-secret-another-secret-123456"));
    expect(await verifySession(foreign)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
  it("rejects expired tokens and invalid roles", async () => {
    const key = new TextEncoder().encode(process.env.SESSION_SECRET);
    const expired = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(key);
    expect(await verifySession(expired)).toBeNull();
    const badRole = await new SignJWT({ ...user, role: "viewer" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(key);
    expect(await verifySession(badRole)).toBeNull();
  });
  it("lasts 8 hours", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(8 * 60 * 60);
  });
});
