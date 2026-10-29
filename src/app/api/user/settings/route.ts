import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { ADMIN_COOKIE_NAME, verifyAdminJwt } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

/**
 * Resolves current authenticated user id from either NextAuth session or admin JWT cookie.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Ignore context error
  }

  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminToken) {
      const verified = await verifyAdminJwt(adminToken);
      if (verified?.id) {
        return verified.id;
      }
    }
  } catch {
    // Ignore context error
  }

  return null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view settings." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(userId).select("settings").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const theme = user.settings?.theme === "light" ? "light" : "dark";

    const response = NextResponse.json({
      settings: {
        theme,
      },
    });
    response.cookies.set("theme", theme, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("[USER SETTINGS GET ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to retrieve user settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to update settings." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { theme } = body;
    if (theme !== "dark" && theme !== "light") {
      return NextResponse.json(
        { error: 'Invalid theme. Expected "dark" or "light".' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { "settings.theme": theme } },
      { returnDocument: "after" }
    ).select("settings");

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const finalTheme = updated.settings?.theme || theme;
    const response = NextResponse.json({
      success: true,
      message: "User settings updated in database.",
      settings: {
        theme: finalTheme,
      },
    });
    response.cookies.set("theme", finalTheme, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("[USER SETTINGS PATCH ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to update user settings in database." },
      { status: 500 }
    );
  }
}
