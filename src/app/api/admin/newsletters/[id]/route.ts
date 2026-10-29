import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import Newsletter, { slugifyTitle } from "@/models/Newsletter";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const newsletter = await Newsletter.findById(id).lean();
    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      newsletter: {
        id: newsletter._id.toString(),
        title: newsletter.title,
        slug: newsletter.slug,
        content: newsletter.content,
        status: newsletter.status,
        publishedAt: newsletter.publishedAt ? new Date(newsletter.publishedAt).toISOString() : null,
        createdAt: new Date(newsletter.createdAt).toISOString(),
        updatedAt: new Date(newsletter.updatedAt).toISOString(),
      },
    });
  } catch (err) {
    console.error("[ADMIN NEWSLETTER GET ID ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to load newsletter." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const { id } = await params;
    const rawBody = await req.json().catch(() => null);

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // Whitelist allowed fields only
    const { title, content, status } = rawBody;

    await connectToDatabase();

    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found." },
        { status: 404 }
      );
    }

    if (title && typeof title === "string" && title.trim().length > 0) {
      const cleanTitle = title.trim();
      if (cleanTitle !== newsletter.title) {
        newsletter.title = cleanTitle;
        // Generate new unique slug
        let baseSlug = slugifyTitle(cleanTitle);
        let finalSlug = baseSlug;
        let counter = 1;
        while (
          await Newsletter.exists({ slug: finalSlug, _id: { $ne: newsletter._id } })
        ) {
          finalSlug = `${baseSlug}-${counter++}`;
        }
        newsletter.slug = finalSlug;
      }
    }

    if (content && typeof content === "string" && content.trim().length > 0) {
      newsletter.content = content.trim();
    }

    if (status === "published" || status === "draft") {
      if (status === "published" && newsletter.status !== "published") {
        newsletter.publishedAt = new Date();
      }
      newsletter.status = status;
    }

    await newsletter.save();

    return NextResponse.json({
      success: true,
      message: `Newsletter "${newsletter.title}" updated successfully.`,
      newsletter: {
        id: newsletter._id.toString(),
        title: newsletter.title,
        slug: newsletter.slug,
        status: newsletter.status,
        publishedAt: newsletter.publishedAt?.toISOString() || null,
      },
    });
  } catch (err) {
    console.error("[ADMIN NEWSLETTER PUT ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to update newsletter." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const deleted = await Newsletter.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Newsletter not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter "${deleted.title}" deleted successfully.`,
    });
  } catch (err) {
    console.error("[ADMIN NEWSLETTER DELETE ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to delete newsletter." },
      { status: 500 }
    );
  }
}
