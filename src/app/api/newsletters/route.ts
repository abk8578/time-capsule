import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";

export const dynamic = "force-dynamic";

/**
 * Creates a clean plain-text preview from markdown or plain text.
 */
function createPreviewExcerpt(content: string, maxLength = 180): string {
  if (!content) return "";
  const cleaned = content
    .replace(/#+\s+/g, "") // remove markdown headings
    .replace(/[*_~`]/g, "") // remove bold, italics, code marks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links with text
    .replace(/\n+/g, " ") // replace newlines with space
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

export async function GET(req: Request) {
  try {
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch {
      // Fallback if called outside Next.js request context
      session = null;
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view newsletters." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "6", 10) || 6));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Update user's lastSeenNewslettersAt timestamp
    await User.findByIdAndUpdate(session.user.id, {
      lastSeenNewslettersAt: new Date(),
    }).catch(() => {
      // non-fatal
    });

    // STRICT FILTER: Only published newsletters, NEVER drafts
    const filter = { status: "published" as const };

    const [total, items] = await Promise.all([
      Newsletter.countDocuments(filter),
      Newsletter.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title slug content publishedAt createdAt")
        .lean(),
    ]);

    const newsletters = items.map((item: any) => ({
      id: item._id.toString(),
      title: item.title,
      slug: item.slug,
      preview: createPreviewExcerpt(item.content),
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
      createdAt: new Date(item.createdAt).toISOString(),
    }));

    return NextResponse.json({
      newsletters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("[PUBLIC NEWSLETTERS GET ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to load newsletters." },
      { status: 500 }
    );
  }
}
