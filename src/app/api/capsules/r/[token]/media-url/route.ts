import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateSignedMediaUrl } from "@/lib/storage";
import { hashToken, isTokenExpired } from "@/lib/cron-utils";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Reject invalid tokens immediately with generic 404
    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // 1. Per-IP rate limit to defend against token enumeration/scraping
    const ip = getClientIp(req.headers);

    const rateCheck = checkRateLimit(`recipient_media:${ip}`, 30, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before retrying." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    // 2. Hash raw token with SHA-256 for lookup
    const tokenHash = hashToken(token);

    const capsule = await Capsule.findOne({
      recipientTokenHash: tokenHash,
    })
      .select("media unlockAt openedEarlyAt recipientTokenExpiresAt")
      .lean();

    // Return generic 404 if not found
    if (!capsule) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    const now = new Date();

    // 3. Expiry check (90 days)
    if (isTokenExpired(capsule.recipientTokenExpiresAt, now)) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // 4. UnlockAt check: must be unlocked
    const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
    if (!isUnlocked) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // 5. Media check
    if (!capsule.media || !capsule.media.key) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // 6. Generate 15-minute ephemeral signed URL
    const signedUrl = await generateSignedMediaUrl(capsule.media.key);
    if (!signedUrl) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        signedUrl,
        mimeType: capsule.media.mimeType,
        mediaType: capsule.media.mediaType,
        duration: capsule.media.duration,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Referrer-Policy": "no-referrer",
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Recipient Media URL Refresh Error]:", msg);
    // Generic 404 to avoid leaking internal error states
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
}
