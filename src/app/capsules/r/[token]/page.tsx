import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import User from "@/models/User";
import MemoriesExperience from "@/components/memories/MemoriesExperience";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashToken, isTokenExpired } from "@/lib/cron-utils";
import { Sparkles, Heart, Clock, AlertTriangle } from "lucide-react";
import LocalDateText from "@/components/LocalDateText";
import CountdownTimer from "@/components/CountdownTimer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Time Capsule",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  referrer: "no-referrer",
};

interface RecipientPageProps {
  params: Promise<{ token: string }>;
}

export default async function RecipientCapsulePage({ params }: RecipientPageProps) {
  const { token } = await params;

  if (!token || typeof token !== "string" || token.length < 16) {
    notFound();
  }

  // 1. Rate limiting by IP to prevent token enumeration/brute-force
  const headerList = await headers();
  const ip = getClientIp(headerList);

  const rateCheck = checkRateLimit(`recipient_access:${ip}`, 15, 60 * 1000);
  if (!rateCheck.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-text">
        <div className="max-w-md w-full p-8 rounded-3xl border border-rose-500/30 bg-card text-center space-y-4">
          <Clock className="h-10 w-10 text-rose-400 mx-auto" />
          <h1 className="font-display text-2xl font-bold">Too Many Requests</h1>
          <p className="text-sm text-muted">
            You have attempted to open capsules too frequently. Please wait a minute before trying again.
          </p>
        </div>
      </div>
    );
  }

  await connectToDatabase();

  // 2. Hash raw token with SHA-256 to locate capsule in DB
  const tokenHash = hashToken(token);

  const capsule = await Capsule.findOne({
    recipientTokenHash: tokenHash,
  }).lean();

  if (!capsule) {
    notFound();
  }

  const now = new Date();

  // 3. Expiry check: 90 days expiration on access tokens
  if (isTokenExpired(capsule.recipientTokenExpiresAt, now)) {
    notFound();
  }

  const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;

  // 4. Lookup sender details
  const sender = await User.findById(capsule.userId).select("name").lean();
  const senderName = sender?.name || "A friend";
  const recipientName = capsule.recipientName || "You";

  // 5. Sealed View (if accessed before unlock date)
  if (!isUnlocked) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex-1 px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-8 sm:p-14 backdrop-blur-2xl shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
            <Heart className="h-3.5 w-3.5" />
            <span>Dedicated to {recipientName} from {senderName}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold text-text">
            &ldquo;{capsule.title}&rdquo;
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto font-light">
            {senderName} sealed this time capsule especially for you. It remains in cryptographic orbital isolation until the exact unlock moment arrived.
          </p>

          <div className="pt-4 max-w-md mx-auto">
            <CountdownTimer unlockAt={capsule.unlockAt.toISOString()} />
          </div>

          <div className="text-xs font-mono text-muted pt-4 border-t border-border/60">
            <span>Scheduled to unseal on: </span>
            <LocalDateText dateString={capsule.unlockAt.toISOString()} />
          </div>

          <div className="pt-4 text-center">
            <a
              href={`mailto:${process.env.SUPPORT_EMAIL || "support@example.com"}?subject=Report%20Capsule%20Abuse`}
              className="inline-flex items-center gap-1.5 text-xs text-muted/60 hover:text-muted transition-colors"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Report this capsule</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 6. Decrypt content securely for unlocked capsule
  let decryptedContent = "";
  if (capsule.isEncrypted && capsule.iv && capsule.authTag && capsule.content) {
    try {
      const { decryptContent } = await import("@/lib/crypto");
      decryptedContent = decryptContent(
        capsule.content,
        capsule.iv,
        capsule.authTag
      );
    } catch {
      console.error(`[Recipient Decrypt Error] capsule_id=${capsule._id}`);
      decryptedContent = "Is capsule ko abhi khol nahi paaye. Thodi der baad try karo.";
    }
  } else {
    decryptedContent = capsule.content || "";
  }

  // 7. Generate signed ephemeral URLs for images and audio
  let signedImages: { url: string; mimeType: string }[] = [];
  let signedMedia: {
    url: string;
    mimeType: string;
    mediaType: "audio" | "video";
    duration?: number;
  } | null = null;

  if (capsule.images && capsule.images.length > 0) {
    try {
      const { generateSignedReadUrls } = await import("@/lib/storage");
      signedImages = await generateSignedReadUrls(capsule.images);
    } catch (err) {
      console.error("[Recipient Storage] Failed to generate signed image URLs:", err);
    }
  }

  if (capsule.media && capsule.media.key) {
    try {
      const { generateSignedMediaUrl } = await import("@/lib/storage");
      const signedUrl = await generateSignedMediaUrl(capsule.media.key);
      if (signedUrl) {
        signedMedia = {
          url: signedUrl,
          mimeType: capsule.media.mimeType,
          mediaType: capsule.media.mediaType,
          duration: capsule.media.duration,
        };
      }
    } catch (err) {
      console.error("[Recipient Storage] Failed to generate signed media URL:", err);
    }
  }

  const createdAtDate = capsule.createdAt ? new Date(capsule.createdAt) : new Date();
  const openedDate = capsule.openedEarlyAt ? new Date(capsule.openedEarlyAt) : capsule.unlockAt;

  const createdAtFormatted = createdAtDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const openedAtFormatted = openedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative">
      {/* Top Recipient Tribute Banner */}
      <div className="w-full bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-amber-950/80 border-b border-indigo-500/30 py-3 px-4 text-center text-xs font-mono backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-indigo-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>
            This memory was sealed in the past by <strong className="text-white font-semibold">{senderName}</strong> especially for <strong className="text-white font-semibold">{recipientName}</strong>.
          </span>
        </div>
      </div>

      <MemoriesExperience
        title={capsule.title}
        content={decryptedContent}
        createdAtIso={createdAtDate.toISOString()}
        openedAtIso={openedDate.toISOString()}
        createdAtFormatted={createdAtFormatted}
        openedAtFormatted={openedAtFormatted}
        isOpenedToday={true}
        signedImages={signedImages}
        signedMedia={signedMedia}
        isOwner={false}
        refreshEndpoint={`/api/capsules/r/${token}/media-url`}
        snapshot={capsule.snapshot || null}
      />

      <div className="py-8 text-center text-xs border-t border-border/40">
        <a
          href={`mailto:${process.env.SUPPORT_EMAIL || "support@example.com"}?subject=Report%20Capsule%20Abuse`}
          className="inline-flex items-center gap-1.5 text-muted hover:text-text transition-colors"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          <span>Report this capsule</span>
        </a>
      </div>
    </div>
  );
}
