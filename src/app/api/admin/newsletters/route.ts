import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import Newsletter, { slugifyTitle } from "@/models/Newsletter";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    await connectToDatabase();

    const newsletters = await Newsletter.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      newsletters: newsletters.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        slug: n.slug,
        content: n.content,
        status: n.status,
        publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : null,
        createdAt: new Date(n.createdAt).toISOString(),
        updatedAt: new Date(n.updatedAt).toISOString(),
        author: {
          name: n.createdBy?.name || "Admin",
          email: n.createdBy?.email || "admin",
        },
      })),
    });
  } catch (err) {
    console.error("[ADMIN NEWSLETTERS GET ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to load newsletters." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user || !auth.sessionUserId) {
    return auth.response!;
  }

  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // Whitelist allowed fields only
    const { title, content, status } = rawBody;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Newsletter title is required." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Newsletter content is required." },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanStatus = status === "published" ? "published" : "draft";
    const publishedAt = cleanStatus === "published" ? new Date() : null;

    await connectToDatabase();

    // Auto-generate unique slug
    let baseSlug = slugifyTitle(cleanTitle);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await Newsletter.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const newsletter = await Newsletter.create({
      title: cleanTitle,
      slug: finalSlug,
      content: cleanContent,
      status: cleanStatus,
      publishedAt,
      createdBy: auth.sessionUserId,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          cleanStatus === "published"
            ? "Newsletter published successfully."
            : "Newsletter draft saved.",
        newsletter: {
          id: newsletter._id.toString(),
          title: newsletter.title,
          slug: newsletter.slug,
          status: newsletter.status,
          publishedAt: newsletter.publishedAt?.toISOString() || null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[ADMIN NEWSLETTER POST ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to create newsletter." },
      { status: 500 }
    );
  }
}
