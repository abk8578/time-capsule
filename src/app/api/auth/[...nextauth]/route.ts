import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

interface RouteHandlerContext {
  params:
    | { nextauth: string[] }
    | Promise<{ nextauth: string[] }>;
}

const authHandler: (
  req: NextRequest,
  ctx: RouteHandlerContext
) => Promise<Response> = NextAuth(authOptions);

function syncDevNextAuthUrl(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
    if (host) {
      process.env.NEXTAUTH_URL = `${proto}://${host}`;
    }
  }
}

export async function GET(req: NextRequest, ctx: RouteHandlerContext) {
  syncDevNextAuthUrl(req);
  return authHandler(req, ctx);
}

export async function POST(req: NextRequest, ctx: RouteHandlerContext) {
  syncDevNextAuthUrl(req);
  return authHandler(req, ctx);
}
