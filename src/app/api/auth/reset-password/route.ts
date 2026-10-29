import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { token, password } = body || {};

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Reset token is missing or malformed." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Secret key must be at least 8 characters in length." },
        { status: 400 }
      );
    }

    // Hash the raw token to match stored SHA-256 hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    await connectToDatabase();

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "This secret key reset link is invalid or has expired. Please request a new transmission.",
        },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt salt rounds = 12
    const passwordHash = await bcrypt.hash(password, 12);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      }
    );

    return NextResponse.json(
      {
        message:
          "Your secret key has been successfully updated. You can now re-enter your constellation orbit.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[ResetPassword API Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your secret key." },
      { status: 500 }
    );
  }
}
