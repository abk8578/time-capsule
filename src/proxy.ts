import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js 16 Proxy handler (replacing deprecated middleware.ts)
 * Protects /dashboard and /capsules/* by verifying JWT session token.
 */
export async function proxy(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-temporal-capsule-key",
    });

    const isAuthenticated = Boolean(token && (token.id || token.sub || token.email));
    const { pathname, searchParams } = req.nextUrl;

    // 1. If user is authenticated and visits auth pages, redirect to dashboard,
    // UNLESS a callbackUrl is present (prevents infinite redirect loops if session state desyncs)
    if (
      isAuthenticated &&
      !searchParams.has("callbackUrl") &&
      (pathname === "/" || pathname === "/login" || pathname === "/signup")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 2. Protect dashboard & capsules from unauthenticated users
    const isProtected =
      pathname.startsWith("/dashboard") || pathname.startsWith("/capsules");

    if (isProtected && !isAuthenticated) {
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
  matcher: ["/", "/login", "/signup", "/dashboard/:path*", "/capsules/:path*"],
};

export default proxy;
