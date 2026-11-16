import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, { value: string; options?: Record<string, unknown> }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined,
    set: (name: string, value: string, options?: Record<string, unknown>) =>
      cookieJar.set(name, { value, options }),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};307;` });
});
vi.mock("next/navigation", () => ({ redirect }));

const { signInAction, signOutAction } = await import("@/app/actions/auth-actions");
const { SESSION_COOKIE, verifySession } = await import("@/auth/session");

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

beforeEach(() => {
  cookieJar.clear();
  redirect.mockClear();
});

describe("auth actions", () => {
  it("sets an httpOnly session cookie and redirects to a safe next path", async () => {
    await expect(
      signInAction(
        null,
        form({ email: "admin@bgs.local", password: "Admin#2026", next: "/admin/topics/new" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/admin/topics/new");
    const cookie = cookieJar.get(SESSION_COOKIE)!;
    expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(await verifySession(cookie.value)).toMatchObject({
      email: "admin@bgs.local",
      role: "owner",
    });
  });

  it("never redirects off-site", async () => {
    await expect(
      signInAction(
        null,
        form({ email: "admin@bgs.local", password: "Admin#2026", next: "//evil.com" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("returns a generic error for bad credentials and sets no cookie", async () => {
    const result = await signInAction(null, form({ email: "admin@bgs.local", password: "wrong" }));
    expect(result).toMatchObject({
      ok: false,
      error: { code: "validation", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
    });
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
  });

  it("signs out by deleting the cookie", async () => {
    cookieJar.set(SESSION_COOKIE, { value: "x" });
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
