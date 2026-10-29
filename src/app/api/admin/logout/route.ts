import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session terminated.",
  });

  // Clear admin_token cookie
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
