import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Capsule from "@/models/Capsule";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim().toLowerCase() || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    if (status === "active") {
      filter.isSuspended = { $ne: true };
    } else if (status === "suspended") {
      filter.isSuspended = true;
    }

    const total = await User.countDocuments(filter);

    // Fetch users - explicitly omit passwordHash and resetPasswordToken
    const users = await User.find(filter)
      .select("+role +isSuspended email name createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = users.map((u) => u._id);

    // Aggregate capsule counts per user
    const now = new Date();
    const capsuleCounts = await Capsule.aggregate([
      {
        $match: {
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$userId",
          total: { $sum: 1 },
          locked: {
            $sum: {
              $cond: [{ $gt: ["$unlockAt", now] }, 1, 0],
            },
          },
          unlocked: {
            $sum: {
              $cond: [{ $lte: ["$unlockAt", now] }, 1, 0],
            },
          },
        },
      },
    ]);

    const countMap = new Map<
      string,
      { total: number; locked: number; unlocked: number }
    >();
    for (const c of capsuleCounts) {
      countMap.set(c._id.toString(), {
        total: c.total,
        locked: c.locked,
        unlocked: c.unlocked,
      });
    }

    const userDTOs = users.map((u) => {
      const stats = countMap.get(u._id.toString()) || {
        total: 0,
        locked: 0,
        unlocked: 0,
      };

      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role || "user",
        isSuspended: Boolean(u.isSuspended),
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        capsuleCount: stats.total,
        lockedCount: stats.locked,
        unlockedCount: stats.unlocked,
      };
    });

    return NextResponse.json({
      users: userDTOs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("[ADMIN USERS GET ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to retrieve user registry." },
      { status: 500 }
    );
  }
}
