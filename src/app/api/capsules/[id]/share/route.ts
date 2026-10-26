import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/capsules/[id]/share
 * Fetches current share status for an owner's unlocked capsule.
 */
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
      .select("shareToken shareIncludeTitle unlockAt openedEarlyAt")
      .lean();

    if (!capsule) {
      return NextResponse.json({ error: "Capsule not found." }, { status: 404 });
    }

    const now = new Date();
    const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
    if (!isUnlocked) {
      return NextResponse.json(
        { error: "Cannot share a sealed capsule." },
        { status: 400 }
      );
    }

    const appUrl = (
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3001"
    ).replace(/\/+$/, "");

    return NextResponse.json({
      isShared: !!capsule.shareToken,
      shareToken: capsule.shareToken || null,
      shareUrl: capsule.shareToken ? `${appUrl}/share/${capsule.shareToken}` : null,
      shareIncludeTitle: !!capsule.shareIncludeTitle,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Get Share Status API Error]:", msg);
    return NextResponse.json({ error: "Failed to retrieve share status." }, { status: 500 });
  }
}

/**
 * POST /api/capsules/[id]/share
 * Generates or updates a public share token for an unlocked capsule.
 */
export async function POST(req: Request, { params }: RouteParams) {
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
    }).select("shareToken shareIncludeTitle unlockAt openedEarlyAt");

    if (!capsule) {
      return NextResponse.json({ error: "Capsule not found." }, { status: 404 });
    }

    const now = new Date();
    const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
    if (!isUnlocked) {
      return NextResponse.json(
        { error: "Cannot share a sealed capsule." },
        { status: 400 }
      );
    }

    let includeTitle = false;
    try {
      const body = await req.json();
      if (typeof body?.includeTitle === "boolean") {
        includeTitle = body.includeTitle;
      }
    } catch {
      // Body is optional
    }

    // Generate secure base64url token if not already generated
    const shareToken =
      capsule.shareToken || crypto.randomBytes(24).toString("base64url");

    capsule.shareToken = shareToken;
    capsule.shareIncludeTitle = includeTitle;
    await capsule.save();

    const appUrl = (
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3001"
    ).replace(/\/+$/, "");

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl: `${appUrl}/share/${shareToken}`,
      shareIncludeTitle: includeTitle,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Create Share Token API Error]:", msg);
    return NextResponse.json({ error: "Failed to create share token." }, { status: 500 });
  }
}

/**
 * PATCH /api/capsules/[id]/share
 * Updates share settings (such as includeTitle toggle) on existing share.
 */
export const PATCH = POST;

/**
 * DELETE /api/capsules/[id]/share
 * Revokes the public share token so public access is immediately invalidated.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
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

    const result = await Capsule.updateOne(
      { _id: id, userId: session.user.id },
      { $set: { shareToken: null, shareIncludeTitle: false } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Capsule not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Share token revoked successfully.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Revoke Share Token API Error]:", msg);
    return NextResponse.json({ error: "Failed to revoke share token." }, { status: 500 });
  }
}
