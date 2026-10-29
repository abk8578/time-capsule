import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch {
      session = null;
    }

    if (!session?.user?.id) {
      return NextResponse.json({ hasUnread: false }, { status: 200 });
    }

    await connectToDatabase();

    const [user, latestPublished] = await Promise.all([
      User.findById(session.user.id).select("lastSeenNewslettersAt").lean(),
      Newsletter.findOne({ status: "published" })
        .sort({ publishedAt: -1 })
        .select("publishedAt")
        .lean(),
    ]);

    if (!latestPublished || !latestPublished.publishedAt) {
      return NextResponse.json({ hasUnread: false });
    }

    if (!user || !user.lastSeenNewslettersAt) {
      // User has never visited newsletters before and a published newsletter exists
      return NextResponse.json({ hasUnread: true });
    }

    const hasUnread =
      new Date(latestPublished.publishedAt).getTime() >
      new Date(user.lastSeenNewslettersAt).getTime();

    return NextResponse.json({ hasUnread });
  } catch (err) {
    console.error("[NEWSLETTER UNREAD CHECK ERROR]:", err);
    return NextResponse.json({ hasUnread: false });
  }
}
