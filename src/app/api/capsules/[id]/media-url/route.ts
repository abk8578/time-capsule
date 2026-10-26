import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { generateSignedMediaUrl } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid capsule ID." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();

    const capsule = await Capsule.findOne({
      _id: id,
      userId: session.user.id,
    })
      .select("media unlockAt openedEarlyAt")
      .lean();

    if (!capsule) {
      return NextResponse.json({ error: "Capsule not found." }, { status: 404 });
    }

    // Security check: Must strictly be unlocked
    const now = new Date();
    const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
    if (!isUnlocked) {
      return NextResponse.json(
        { error: "Forbidden: This capsule is still time-locked." },
        { status: 403 }
      );
    }

    if (!capsule.media || !capsule.media.key) {
      return NextResponse.json({ error: "No media attached to this capsule." }, { status: 404 });
    }

    const signedUrl = await generateSignedMediaUrl(capsule.media.key);
    if (!signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate signed URL from storage." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl,
      mimeType: capsule.media.mimeType,
      mediaType: capsule.media.mediaType,
      duration: capsule.media.duration,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Media URL Refresh API Error]:", msg);
    return NextResponse.json(
      { error: "Failed to refresh media stream URL." },
      { status: 500 }
    );
  }
}
