import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    // Limit to 5 reset requests per 15 minutes per IP
    const rateLimit = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error:
            "Too many password reset requests from this network. Please wait a few moments before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const email = body?.email;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid cosmic email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    // For privacy & security, we return success even if user doesn't exist
    if (user) {
      // Generate secure 32-byte raw token
      const rawToken = crypto.randomBytes(32).toString("hex");
      // Store SHA-256 hash in database
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires,
          },
        }
      );

      // Determine accurate base URL from request headers or environment
      const proto = req.headers.get("x-forwarded-proto") || "https";
      const host =
        req.headers.get("x-forwarded-host") ||
        req.headers.get("host") ||
        process.env.VERCEL_URL ||
        "localhost:3000";
      const origin =
        host.startsWith("http://") || host.startsWith("https://")
          ? host
          : `${proto}://${host}`;

      const resetUrl = `${origin.replace(/\/+$/, "")}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
      } catch (emailErr) {
        console.error("[ForgotPassword Email Dispatch Error]:", emailErr);
        // Do not crash, proceed with response
      }
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists in our constellation, a secret key reset link has been dispatched.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[ForgotPassword API Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
