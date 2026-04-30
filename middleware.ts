import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "quickgist_admin";
const ADMIN_HEADER = "x-admin-api-key";

/**
 * Resolve the expected admin key without importing server config (middleware
 * runs in the Edge runtime which can't pull the full Node lib).
 */
function expectedKey(): string {
  const key = process.env.ADMIN_API_KEY;
  if (key && key.length > 0) return key;
  if (process.env.NODE_ENV !== "production") return "dev-admin-key";
  return "";
}

function isAuthenticated(request: NextRequest): boolean {
  const expected = expectedKey();
  if (!expected) return false;
  const header = request.headers.get(ADMIN_HEADER);
  if (header && header === expected) return true;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(cookie && cookie === expected);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Admin pages
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/logout") return NextResponse.next();
    if (!isAuthenticated(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  // Operational APIs (admin-only). The login session endpoint is intentionally public.
  const isLoginEndpoint = pathname === "/api/admin/session";
  const protectedApiPrefixes = [
    "/api/ingest",
    "/api/trending/detect",
    "/api/generate",
    "/api/quality",
    "/api/publish",
    "/api/distribution",
    "/api/pipeline",
    "/api/admin"
  ];
  if (!isLoginEndpoint && protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/ingest/:path*",
    "/api/trending/detect",
    "/api/generate/:path*",
    "/api/quality/:path*",
    "/api/publish/:path*",
    "/api/distribution/:path*",
    "/api/pipeline/:path*"
  ]
};
