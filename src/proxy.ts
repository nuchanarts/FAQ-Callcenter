import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/auth/session";

/** Request header carrying the original path so server code can redirect back after sign-in. */
export const PATHNAME_HEADER = "x-bgs-pathname";

/**
 * Optimistic check (Next.js 16 Proxy): missing, expired or forged sessions on /admin are sent
 * to /login with the requested path kept. Real authorization still happens server-side in every
 * admin page and action (requireAdmin), which also checks the admin still exists.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname + request.nextUrl.search;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, path);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
