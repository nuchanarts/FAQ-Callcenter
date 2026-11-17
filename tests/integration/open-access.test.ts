import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  const config = actual.readConfig({ ...process.env, OPEN_ADMIN_ACCESS: "true" });
  return { ...actual, getConfig: () => config };
});

const { getAdmin, OPEN_ACCESS_USER } = await import("@/auth/current-admin");

describe("OPEN_ADMIN_ACCESS (temporary, no sign-in)", () => {
  it("treats a visitor without a session as an owner", async () => {
    expect(await getAdmin()).toEqual(OPEN_ACCESS_USER);
    expect(OPEN_ACCESS_USER.role).toBe("owner");
  });
});
