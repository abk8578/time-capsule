import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import User from "@/models/User";
import {
  sendUnlockEmail,
  sendReminderEmail,
  sendRecipientUnlockEmail,
} from "@/lib/email";
import { hashToken, shouldSendReminder } from "@/lib/cron-utils";

// Ensure this route is evaluated dynamically on every cron trigger
export const dynamic = "force-dynamic";

/**
 * Timing-safe string comparison to protect against timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    // Enforce CRON_SECRET requirement
    if (!cronSecret || !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authorization header or secret unconfigured" },
        { status: 401 }
      );
    }

    const expectedHeader = `Bearer ${cronSecret}`;
    if (!safeCompare(authHeader, expectedHeader)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid cron authorization token" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const now = new Date();
    const nowTime = now.getTime();
    const twentyFourHoursFromNow = new Date(nowTime + 24 * 60 * 60 * 1000);

    // =========================================================================
    // PART 1: UNLOCK CAPSULES (Owner & Recipient Notifications)
    // Rule: Use { $ne: true } for legacy documents where flags may be undefined.
    // =========================================================================
    const capsulesToUnlock = await Capsule.find({
      unlockAt: { $lte: now },
      $or: [
        { notified: { $ne: true } },
        { recipientEmail: { $ne: null }, recipientNotified: { $ne: true } },
      ],
    })
      .select("userId recipientEmail recipientName recipientNotified notified unlockAt createdAt reminderSent")
      .limit(50)
      .lean();

    let unlockProcessed = 0;
    let unlockSent = 0;
    let unlockFailed = 0;
    let recipientSent = 0;
    let recipientFailed = 0;

    for (const capsule of capsulesToUnlock) {
      unlockProcessed++;

      // Fetch owner details
      const owner = await User.findById(capsule.userId).select("email name").lean();
      const ownerEmail = owner?.email?.toLowerCase();
      const recipientEmail = capsule.recipientEmail?.toLowerCase();

      // Check self-send: recipient == sender email -> only send 1 notification (to owner)
      const isSelfSend = !!(ownerEmail && recipientEmail && ownerEmail === recipientEmail);

      // 1. Owner notification
      if (capsule.notified !== true) {
        const claimed = await Capsule.findOneAndUpdate(
          { _id: capsule._id, notified: { $ne: true } },
          { notified: true },
          { new: true }
        );

        if (claimed) {
          if (owner?.email) {
            try {
              await sendUnlockEmail({
                to: owner.email,
                name: owner.name || "Time Traveler",
                capsuleId: capsule._id.toString(),
              });
              unlockSent++;

              // If self-send, mark recipient as notified to prevent a duplicate email
              if (isSelfSend && capsule.recipientNotified !== true) {
                await Capsule.updateOne(
                  { _id: capsule._id },
                  { recipientNotified: true }
                );
              }
            } catch (err: unknown) {
              await Capsule.updateOne({ _id: capsule._id }, { notified: false });
              unlockFailed++;
              const errMsg = err instanceof Error ? err.message : "Unknown error";
              console.error(`[Cron Unlock Owner Error] capsule=${capsule._id}:`, errMsg);
            }
          }
        }
      }

      // 2. Recipient notification (if not self-send and not yet notified)
      if (capsule.recipientEmail && capsule.recipientNotified !== true && !isSelfSend) {
        // Generate secure 32-byte hex token, hash with SHA-256, set 90-day expiry
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);
        const recipientTokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

        const claimedRecipient = await Capsule.findOneAndUpdate(
          { _id: capsule._id, recipientNotified: { $ne: true } },
          {
            recipientTokenHash: tokenHash,
            recipientTokenExpiresAt,
            recipientNotified: true,
          },
          { new: true }
        );

        if (claimedRecipient) {
          const senderName = owner?.name || "A friend";

          try {
            await sendRecipientUnlockEmail({
              to: capsule.recipientEmail,
              recipientName: capsule.recipientName,
              senderName,
              rawToken,
            });
            recipientSent++;
          } catch (err: unknown) {
            // Rollback recipient claim on email failure: clear BOTH recipientTokenHash and recipientTokenExpiresAt
            await Capsule.updateOne(
              { _id: capsule._id },
              {
                recipientNotified: false,
                recipientTokenHash: null,
                recipientTokenExpiresAt: null,
              }
            );
            recipientFailed++;
            const errMsg = err instanceof Error ? err.message : "Unknown error";
            console.error(`[Cron Unlock Recipient Error] capsule=${capsule._id}:`, errMsg);
          }
        }
      }
    }

    // =========================================================================
    // PART 2: 24-HOUR ADVANCE REMINDER TO SENDER (Feature 3)
    // Conditions:
    // - unlockAt > now
    // - unlockAt <= now + 24 hours
    // - reminderSent: { $ne: true }
    // - unlockAt - createdAt > 48 hours
    // =========================================================================
    const reminderCandidates = await Capsule.find({
      unlockAt: { $gt: now, $lte: twentyFourHoursFromNow },
      reminderSent: { $ne: true },
    })
      .select("_id userId title unlockAt createdAt")
      .limit(50)
      .lean();

    let reminderProcessed = 0;
    let reminderSentCount = 0;
    let reminderFailedCount = 0;

    for (const capsule of reminderCandidates) {
      // Rule: only send reminder if capsule total lifespan > 48h and in 24h window
      if (!shouldSendReminder(capsule.createdAt, capsule.unlockAt, now)) {
        // Lifespan <= 48 hours or outside window, mark reminderSent=true so it doesn't re-query
        await Capsule.updateOne({ _id: capsule._id }, { reminderSent: true });
        continue;
      }

      reminderProcessed++;

      // Atomic claim using { reminderSent: { $ne: true } }
      const claimed = await Capsule.findOneAndUpdate(
        { _id: capsule._id, reminderSent: { $ne: true } },
        { reminderSent: true },
        { new: true }
      );

      if (!claimed) continue;

      const user = await User.findById(capsule.userId).select("email name").lean();
      if (!user?.email) continue;

      const unlockFormatted = new Date(capsule.unlockAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      try {
        await sendReminderEmail({
          to: user.email,
          name: user.name || "Time Traveler",
          capsuleId: capsule._id.toString(),
          unlockAtFormatted: unlockFormatted,
        });
        reminderSentCount++;
      } catch (err: unknown) {
        // Rollback reminderSent flag on email failure
        await Capsule.updateOne({ _id: capsule._id }, { reminderSent: false });
        reminderFailedCount++;
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Cron Reminder Error] capsule=${capsule._id}:`, errMsg);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      unlock: {
        processed: unlockProcessed,
        ownerSent: unlockSent,
        ownerFailed: unlockFailed,
        recipientSent,
        recipientFailed,
      },
      reminder: {
        processed: reminderProcessed,
        sent: reminderSentCount,
        failed: reminderFailedCount,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cron Unlock Error] Internal error:", errorMsg);
    return NextResponse.json(
      { error: "Internal server error during cron execution" },
      { status: 500 }
    );
  }
}
