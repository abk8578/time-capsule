import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { deleteStorageObjects } from "@/lib/storage";

export const dynamic = "force-dynamic";

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

    const capsule = await Capsule.findById(id).select("images media title");
    if (!capsule) {
      return NextResponse.json(
        { error: "Capsule not found." },
        { status: 404 }
      );
    }

    // Purge associated storage files
    const storageKeys: string[] = [];
    if (Array.isArray(capsule.images)) {
      for (const img of capsule.images) {
        if (img.key) storageKeys.push(img.key);
      }
    }
    if (capsule.media?.key) {
      storageKeys.push(capsule.media.key);
    }

    if (storageKeys.length > 0) {
      try {
        await deleteStorageObjects(storageKeys);
      } catch (storageErr) {
        console.warn("[ADMIN DELETE CAPSULE STORAGE WARNING]:", storageErr);
      }
    }

    await Capsule.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Capsule "${capsule.title}" deleted successfully.`,
    });
  } catch (err) {
    console.error("[ADMIN CAPSULE DELETE ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to delete capsule." },
      { status: 500 }
    );
  }
}
