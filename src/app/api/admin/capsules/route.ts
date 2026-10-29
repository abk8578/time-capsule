import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim().toLowerCase() || "all";
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const now = new Date();
    const filter: Record<string, unknown> = {};

    // Filter by locked / unlocked status
    if (status === "locked") {
      filter.unlockAt = { $gt: now };
    } else if (status === "unlocked") {
      filter.unlockAt = { $lte: now };
    }

    // Filter by date range (unlockAt or createdAt)
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) dateFilter.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          // Set to end of day if only YYYY-MM-DD
          if (to.length === 10) toDate.setHours(23, 59, 59, 999);
          dateFilter.$lte = toDate;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        // Apply to unlockAt if status filter exists, otherwise unlockAt
        filter.unlockAt = { ...(filter.unlockAt as object || {}), ...dateFilter };
      }
    }

    // Filter by search keyword in title or recipientEmail
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Search in title, recipientEmail, or search users for creator email
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: escaped, $options: "i" } },
          { name: { $regex: escaped, $options: "i" } },
        ],
      }).select("_id").lean();

      const matchingUserIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { recipientEmail: { $regex: escaped, $options: "i" } },
        { recipientName: { $regex: escaped, $options: "i" } },
        ...(matchingUserIds.length > 0 ? [{ userId: { $in: matchingUserIds } }] : []),
      ];
    }

    const total = await Capsule.countDocuments(filter);

    // CRITICAL PRIVACY REQUIREMENT:
    // Strictly omit `content` and raw private data by default (.select("-content"))
    const capsules = await Capsule.find(filter)
      .select("-content")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const capsuleDTOs = capsules.map((c: any) => {
      const unlockDate = new Date(c.unlockAt);
      const isUnlocked = unlockDate <= now;

      return {
        id: c._id.toString(),
        title: c.title,
        unlockAt: unlockDate.toISOString(),
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        isUnlocked,
        creator: {
          id: c.userId?._id ? c.userId._id.toString() : String(c.userId || "Unknown"),
          name: c.userId?.name || "Unknown Creator",
          email: c.userId?.email || "Unknown Email",
        },
        recipientEmail: c.recipientEmail || null,
        recipientName: c.recipientName || null,
        imageCount: Array.isArray(c.images) ? c.images.length : 0,
        hasAudio: Boolean(c.media?.key),
        openedEarlyAt: c.openedEarlyAt ? new Date(c.openedEarlyAt).toISOString() : null,
      };
    });

    return NextResponse.json({
      capsules: capsuleDTOs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("[ADMIN CAPSULES GET ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to retrieve capsules." },
      { status: 500 }
    );
  }
}
