import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_COOKIE_NAME, verifyAdminJwt } from "@/lib/admin";

/**
 * Next.js 16 Proxy handler (replacing deprecated middleware.ts)
 * Protects /dashboard and /capsules/* by verifying NextAuth JWT session token,
 * and protects /admin/* and /api/admin/* by verifying the admin_token JWT.
 */
export async function proxy(req: NextRequest) {
  try {
    const { pathname, searchParams } = req.nextUrl;

    // 1. Verify admin_token JWT
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    let isAdminJwtValid = false;
    if (adminToken) {
      const verified = await verifyAdminJwt(adminToken);
      if (verified && verified.role === "admin") {
        isAdminJwtValid = true;
      }
    }

    // 2. Verify consumer NextAuth JWT
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-temporal-capsule-key",
    });

    const isAuthenticated = Boolean(token && (token.id || token.sub || token.email));
    const isAdminAuthenticated = isAdminJwtValid || (isAuthenticated && token?.role === "admin");

    // 3. Admin API endpoints
    if (pathname.startsWith("/api/admin")) {
      if (pathname === "/api/admin/login") {
        return NextResponse.next();
      }
      if (!isAdminAuthenticated) {
        return NextResponse.json(
          { error: "Unauthorized. Admin JWT token required." },
          { status: 401 }
        );
      }
    }

    // 4. Admin page routes: /admin/login is open; all other /admin/* require admin JWT
    if (pathname.startsWith("/admin")) {
      if (pathname === "/admin/login") {
        if (isAdminAuthenticated) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.next();
      }
      if (!isAdminAuthenticated) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }

    // 5. If user is authenticated and visits auth pages, redirect to dashboard,
    // UNLESS a callbackUrl is present (prevents infinite redirect loops if session state desyncs)
    if (
      isAuthenticated &&
      !searchParams.has("callbackUrl") &&
      (pathname === "/" || pathname === "/login" || pathname === "/signup")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 6. Protect consumer dashboard & capsules from unauthenticated users
    const isUserProtected =
      pathname.startsWith("/dashboard") || pathname.startsWith("/capsules");

    if (isUserProtected && !isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.warn("[Proxy Middleware Non-Fatal Warning]:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/capsules/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};

export default proxy;
