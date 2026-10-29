import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Capsule from "@/models/Capsule";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    await connectToDatabase();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      totalCapsules,
      lockedCapsules,
      unlockedCapsules,
      openingNext7Days,
      signupsAggregation,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Capsule.countDocuments(),
      Capsule.countDocuments({ unlockAt: { $gt: now } }),
      Capsule.countDocuments({ unlockAt: { $lte: now } }),
      Capsule.countDocuments({ unlockAt: { $gt: now, $lte: sevenDaysFromNow } }),
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build complete 30-day date map so days with 0 signups are properly represented
    const signupsMap = new Map<string, number>();
    for (const item of signupsAggregation) {
      signupsMap.set(item._id, item.count);
    }

    const signupsLast30Days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0];
      signupsLast30Days.push({
        date: dateKey,
        count: signupsMap.get(dateKey) || 0,
      });
    }

    return NextResponse.json({
      totalUsers,
      newUsersLast7Days,
      totalCapsules,
      lockedCapsules,
      unlockedCapsules,
      openingNext7Days,
      signupsLast30Days,
    });
  } catch (err) {
    console.error("[ADMIN STATS ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to compile admin metrics." },
      { status: 500 }
    );
  }
}
