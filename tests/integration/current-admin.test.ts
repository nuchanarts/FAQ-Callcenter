import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));

const { getAdmin, requireAdmin } = await import("@/auth/current-admin");
const { signSession, SESSION_COOKIE } = await import("@/auth/session");
const { resetRepositoriesForTests } = await import("@/repositories");
const { UnauthorizedError } = await import("@/domain/errors");

beforeEach(() => {
  cookieJar.clear();
  resetRepositoriesForTests();
});

async function setSession(user: Parameters<typeof signSession>[0]) {
  cookieJar.set(SESSION_COOKIE, await signSession(user));
}

describe("current admin", () => {
  it("accepts a valid session for an existing admin, using the stored role", async () => {
    await setSession({
      id: "a-editor",
      email: "editor@bgs.local",
      displayName: "x",
      role: "owner",
    });
    expect(await getAdmin()).toMatchObject({
      id: "a-editor",
      email: "editor@bgs.local",
      role: "approver",
    });
  });

  it("rejects sessions of admins who no longer exist (revocation)", async () => {
    await setSession({ id: "a-gone", email: "removed@bgs.local", displayName: "x", role: "owner" });
    expect(await getAdmin()).toBeNull();
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a session whose id does not match the stored account", async () => {
    await setSession({ id: "forged", email: "admin@bgs.local", displayName: "x", role: "owner" });
    expect(await getAdmin()).toBeNull();
  });

  it("returns null without a cookie", async () => {
    expect(await getAdmin()).toBeNull();
  });
});
