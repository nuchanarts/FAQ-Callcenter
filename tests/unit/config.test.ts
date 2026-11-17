import { describe, expect, it } from "vitest";
import { readConfig } from "@/lib/config";

const PROD = { NODE_ENV: "production", DATA_BACKEND: "memory", SESSION_SECRET: "x".repeat(32) };

describe("config", () => {
  it("defaults to the file backend in development", () => {
    expect(readConfig({}).backend).toBe("file");
  });

  it("requires an explicit DATA_BACKEND in production (no silent local file store)", () => {
    expect(() => readConfig({ ...PROD, DATA_BACKEND: undefined })).toThrow(/DATA_BACKEND/);
  });

  it("rejects unknown backends", () => {
    expect(() => readConfig({ DATA_BACKEND: "mongo" })).toThrow(/DATA_BACKEND/);
  });

  it("requires a strong SESSION_SECRET in production", () => {
    expect(() => readConfig({ ...PROD, SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/);
    expect(() => readConfig({ ...PROD, SESSION_SECRET: undefined })).toThrow(/SESSION_SECRET/);
    expect(readConfig(PROD).sessionSecret).toHaveLength(32);
  });

  it("rejects publicly known secrets in production", () => {
    for (const known of [
      "change-me-to-a-long-random-string-32chars",
      "dev-only-session-secret-do-not-use-in-prod",
    ]) {
      expect(() => readConfig({ ...PROD, SESSION_SECRET: known })).toThrow(/SESSION_SECRET/);
    }
  });

  it("uses a dev secret outside production", () => {
    expect(readConfig({}).sessionSecret.length).toBeGreaterThanOrEqual(32);
  });

  it("requires supabase credentials for the supabase backend", () => {
    expect(() => readConfig({ DATA_BACKEND: "supabase" })).toThrow(/SUPABASE/);
  });
});

describe("temporary staff owner (before Google Sign-In)", () => {
  const prod = {
    NODE_ENV: "production",
    DATA_BACKEND: "memory",
    SESSION_SECRET: "x".repeat(40),
  };
  it("password login stays off in production unless explicitly enabled", () => {
    expect(readConfig(prod).passwordLogin).toBe(false);
    expect(readConfig({ ...prod, STAFF_PASSWORD_LOGIN: "true" }).passwordLogin).toBe(true);
  });
  it("reads one owner from env, requiring a real scrypt hash", () => {
    const owner = readConfig({
      ...prod,
      STAFF_OWNER_EMAIL: " Owner@BGS-faq.local ",
      STAFF_OWNER_PASSWORD_HASH: "scrypt$aa$bb",
    }).staffOwner;
    expect(owner).toEqual({
      email: "owner@bgs-faq.local",
      displayName: "ผู้ดูแลระบบ",
      passwordHash: "scrypt$aa$bb",
    });
    expect(() =>
      readConfig({ ...prod, STAFF_OWNER_EMAIL: "a@b.c", STAFF_OWNER_PASSWORD_HASH: "plain" }),
    ).toThrow(/hash-password/);
  });
});
