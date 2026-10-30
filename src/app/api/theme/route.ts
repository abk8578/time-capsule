import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SeasonalTheme from "@/models/SeasonalTheme";
import { resolveSeason } from "@/lib/seasonal-theme";

export const dynamic = "force-dynamic";

/**
 * Public read-only endpoint (no auth required).
 * Returns the current season configuration.
 * When auto is ON, activeSeason is computed dynamically from the server's current date.
 * Cached briefly via Cache-Control header.
 */
export async function GET() {
  try {
    let settings = null;
    try {
      await connectToDatabase();
      settings = await SeasonalTheme.findOne({
        singletonKey: "active_seasonal_theme",
      }).lean();
    } catch (dbErr) {
      console.warn("[PUBLIC_SEASON_GET] Database connection notice:", dbErr);
    }

    const resolved = resolveSeason(settings);

    return NextResponse.json(resolved, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("[PUBLIC_SEASON_GET_ERROR]:", err);
    const fallback = resolveSeason(null);
    return NextResponse.json(fallback, { status: 200 });
  }
}
