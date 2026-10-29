import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import {
  signAdminJwt,
  ADMIN_COOKIE_NAME,
  getAdminJwtCookieOptions,
} from "@/lib/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);

    // Rate limiting: 5 attempts per 15 min per IP
    const rateCheck = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            "Too many failed administrator login attempts. Please wait 15 minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const email = body?.email;
    const password = body?.password;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and passcode are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectToDatabase();

    // Query user and explicitly select hidden fields, passwordHash & settings
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+role passwordHash email name isSuspended settings"
    );

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: "Account has been suspended. Please contact technical support." },
        { status: 403 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Account does not possess administrator privileges." },
        { status: 403 }
      );
    }

    // Generate cryptographic HS256 JWT (jose)
    const jwtToken = await signAdminJwt({
      id: user._id.toString(),
      email: user.email,
      role: "admin",
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully.",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: "admin",
      },
    });

    // Set secure httpOnly admin_token cookie
    const cookieOptions = getAdminJwtCookieOptions();
    response.cookies.set(ADMIN_COOKIE_NAME, jwtToken, cookieOptions);

    // Also synchronize user's saved theme preference cookie
    if (user.settings?.theme) {
      response.cookies.set("theme", user.settings.theme, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err) {
    console.error("[ADMIN LOGIN API ERROR]:", err);
    return NextResponse.json(
      { error: "Internal server error during administrative login." },
      { status: 500 }
    );
  }
}
