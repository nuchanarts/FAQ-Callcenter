import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/auth/session";

/**
 * Optimistic check only (Next.js 16 Proxy): signed-out visitors to /admin are sent to /login.
 * The real authorization happens server-side in every admin page and action (requireAdmin).
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
