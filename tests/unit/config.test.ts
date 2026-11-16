import { afterEach, describe, expect, it, vi } from "vitest";
import { readConfig } from "@/lib/config";

afterEach(() => vi.unstubAllEnvs());

describe("config", () => {
  it("defaults to the file backend", () => {
    expect(readConfig({}).backend).toBe("file");
  });
  it("rejects unknown backends", () => {
    expect(() => readConfig({ DATA_BACKEND: "mongo" })).toThrow(/DATA_BACKEND/);
  });
  it("requires a strong SESSION_SECRET in production", () => {
    expect(() => readConfig({ NODE_ENV: "production", SESSION_SECRET: "short" })).toThrow(
      /SESSION_SECRET/,
    );
    expect(
      readConfig({ NODE_ENV: "production", SESSION_SECRET: "x".repeat(32) }).sessionSecret,
    ).toHaveLength(32);
  });
  it("uses a dev secret outside production", () => {
    expect(readConfig({}).sessionSecret.length).toBeGreaterThanOrEqual(32);
  });
  it("requires supabase credentials for the supabase backend", () => {
    expect(() => readConfig({ DATA_BACKEND: "supabase" })).toThrow(/SUPABASE/);
  });
});
