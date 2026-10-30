import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import SeasonalTheme from "@/models/SeasonalTheme";
import AdminLog from "@/models/AdminLog";
import {
  resolveSeason,
  isValidSeason,
  clampIntensity,
} from "@/lib/seasonal-theme";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/theme
 * Admin-guarded endpoint to retrieve stored season settings.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    await connectToDatabase();
    const settings = await SeasonalTheme.findOne({
      singletonKey: "active_seasonal_theme",
    }).lean();

    const resolved = resolveSeason(settings);
    return NextResponse.json({
      settings: resolved,
    });
  } catch (err) {
    console.error("[ADMIN_SEASON_GET_ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to retrieve season settings." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/theme
 * Admin-guarded endpoint to update seasonal settings.
 * Record format: { auto: boolean, season: "default" | "halloween" | "christmas", intensity: 1 | 2 | 3 }
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const seasonInput = rawBody.season ?? rawBody.theme;

    // Strict validation: Reject unknown season values
    if (seasonInput !== undefined && !isValidSeason(seasonInput)) {
      return NextResponse.json(
        {
          error:
            "Invalid season value. Allowed options are 'default', 'halloween', or 'christmas'.",
        },
        { status: 400 }
      );
    }

    const cleanAuto = typeof rawBody.auto === "boolean" ? rawBody.auto : true;
    const cleanSeason = isValidSeason(seasonInput) ? seasonInput : "default";
    const cleanIntensity = clampIntensity(rawBody.intensity);

    await connectToDatabase();

    const updated = await SeasonalTheme.findOneAndUpdate(
      { singletonKey: "active_seasonal_theme" },
      {
        $set: {
          auto: cleanAuto,
          season: cleanSeason,
          theme: cleanSeason,
          intensity: cleanIntensity,
          updatedBy: auth.user.email,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Audit log
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "Unknown";
      await AdminLog.create({
        action: "UPDATE_SEASONAL_SETTINGS",
        adminEmail: auth.user.email,
        details: {
          auto: cleanAuto,
          season: cleanSeason,
          intensity: cleanIntensity,
        },
        ip,
        userAgent,
      });
    } catch (logErr) {
      console.warn("[ADMIN_SEASON_LOG_WARN]:", logErr);
    }

    const resolved = resolveSeason(updated);

    return NextResponse.json({
      success: true,
      message: "Seasonal settings published successfully.",
      settings: resolved,
    });
  } catch (err) {
    console.error("[ADMIN_SEASON_POST_ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to publish seasonal settings." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
