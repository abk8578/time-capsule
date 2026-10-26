import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { deleteStorageObjects } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid capsule ID format." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    await connectToDatabase();

    // Verify capsule exists and is owned by the requesting user
    const capsule = await Capsule.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!capsule) {
      return NextResponse.json({ error: "Capsule not found." }, { status: 404 });
    }

    // Collect all associated storage files (images and audio)
    const storageKeysToDelete: string[] = [];

    if (capsule.images && Array.isArray(capsule.images)) {
      for (const img of capsule.images) {
        if (img.key) storageKeysToDelete.push(img.key);
      }
    }

    if (capsule.media && capsule.media.key) {
      storageKeysToDelete.push(capsule.media.key);
    }

    // Transactionally purge files from Supabase storage
    if (storageKeysToDelete.length > 0) {
      await deleteStorageObjects(storageKeysToDelete);
    }

    // Delete record from database
    await Capsule.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: "Capsule and associated media deleted successfully.",
      deletedFilesCount: storageKeysToDelete.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Delete Capsule API Error]:", msg);
    return NextResponse.json(
      { error: "Failed to delete capsule and its assets." },
      { status: 500 }
    );
  }
}
