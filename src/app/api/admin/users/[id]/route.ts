import { NextResponse } from "next/server";
import { requireAdmin, validateAdminTargetAction } from "@/lib/admin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Capsule from "@/models/Capsule";
import { deleteStorageObjects } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user || !auth.sessionUserId) {
    return auth.response!;
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action !== "suspend" && action !== "unsuspend") {
      return NextResponse.json(
        { error: "Invalid action. Allowed actions: 'suspend', 'unsuspend'." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetUser = await User.findById(id).select("+role +isSuspended email name");
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found." },
        { status: 404 }
      );
    }

    // Security check: cannot suspend self or other admins
    const validation = validateAdminTargetAction(auth.sessionUserId, targetUser);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.error || "Action not permitted on this account." },
        { status: 403 }
      );
    }

    const shouldSuspend = action === "suspend";
    targetUser.isSuspended = shouldSuspend;
    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: shouldSuspend
        ? `User ${targetUser.email} has been suspended.`
        : `User ${targetUser.email} has been reactivated.`,
      isSuspended: targetUser.isSuspended,
    });
  } catch (err) {
    console.error("[ADMIN USER PATCH ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to update user status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user || !auth.sessionUserId) {
    return auth.response!;
  }

  try {
    const { id } = await params;

    await connectToDatabase();

    const targetUser = await User.findById(id).select("+role email name");
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found." },
        { status: 404 }
      );
    }

    // Security check: cannot delete self or other admins
    const validation = validateAdminTargetAction(auth.sessionUserId, targetUser);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.error || "Action not permitted on this account." },
        { status: 403 }
      );
    }

    // 1. Find all capsules owned by this user to clean up media
    const userCapsules = await Capsule.find({ userId: id }).select("images media").lean();

    const storageKeysToDelete: string[] = [];
    for (const c of userCapsules) {
      if (Array.isArray(c.images)) {
        for (const img of c.images) {
          if (img.key) storageKeysToDelete.push(img.key);
        }
      }
      if (c.media?.key) {
        storageKeysToDelete.push(c.media.key);
      }
    }

    if (storageKeysToDelete.length > 0) {
      try {
        await deleteStorageObjects(storageKeysToDelete);
      } catch (storageErr) {
        console.warn("[ADMIN DELETE USER STORAGE CLEANUP WARNING]:", storageErr);
      }
    }

    // 2. Cascade delete all user capsules
    const deleteCapsulesResult = await Capsule.deleteMany({ userId: id });

    // 3. Delete user account
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} and ${deleteCapsulesResult.deletedCount} associated capsules were successfully deleted.`,
      deletedCapsulesCount: deleteCapsulesResult.deletedCount,
    });
  } catch (err) {
    console.error("[ADMIN USER DELETE ERROR]:", err);
    return NextResponse.json(
      { error: "Failed to delete user account." },
      { status: 500 }
    );
  }
}
