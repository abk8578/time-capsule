import { NextResponse } from "next/server";

export const AUTH_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "next-auth.state",
];

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export async function GET(req: Request) {
  const url = new URL("/login", req.url);
  const response = NextResponse.redirect(url);

  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}
