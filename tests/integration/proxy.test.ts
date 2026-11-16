import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy, PATHNAME_HEADER } from "@/proxy";
import { SESSION_COOKIE, signSession } from "@/auth/session";

function request(path: string, cookie?: string) {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (cookie) req.cookies.set(SESSION_COOKIE, cookie);
  return req;
}

describe("proxy (optimistic admin redirect)", () => {
  it("redirects signed-out visitors to /login keeping the requested path", async () => {
    const res = await proxy(request("/admin/topics/b-1?x=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fadmin%2Ftopics%2Fb-1%3Fx%3D1",
    );
  });

  it("also redirects invalid or expired sessions with the path kept", async () => {
    const res = await proxy(request("/admin/topics/b-1", "expired-or-forged"));
    expect(res.headers.get("location")).toContain("next=%2Fadmin%2Ftopics%2Fb-1");
  });

  it("lets valid sessions through and forwards the path for server-side redirects", async () => {
    const token = await signSession({ id: "a", email: "a@b.c", displayName: "A", role: "owner" });
    const res = await proxy(request("/admin/topics/b-1", token));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe("/admin/topics/b-1");
  });
});
