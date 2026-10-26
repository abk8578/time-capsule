import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import CountdownTimer from "@/components/CountdownTimer";
import LocalDateText from "@/components/LocalDateText";
import DigUpRevealer from "@/components/DigUpRevealer";
import MemoriesExperience from "@/components/memories/MemoriesExperience";
import DeleteCapsuleButton from "@/components/capsules/DeleteCapsuleButton";

export const dynamic = "force-dynamic";

interface CapsuleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CapsuleDetailPage({ params }: CapsuleDetailPageProps) {
  const { id } = await params;

  // 1. Validate MongoDB ObjectId format
  if (!mongoose.isValidObjectId(id)) {
    notFound();
  }

  // 2. Authenticate session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/capsules/${id}`);
  }

  await connectToDatabase();

  // 3. Compute server-side "now" to decide unlock state (never trust client clock)
  const now = new Date();

  // 4. Query metadata with STRICT whitelist (.select("title unlockAt createdAt openedEarlyAt"))
  // Must belong to the authenticated user. If not found OR owned by someone else, return 404 (never 403).
  const metadata = await Capsule.findOne({
    _id: id,
    userId: session.user.id,
  })
    .select("title unlockAt createdAt openedEarlyAt")
    .lean();

  if (!metadata) {
    notFound();
  }

  const isUnlocked = metadata.unlockAt <= now || !!metadata.openedEarlyAt;

  // 5. If unlocked, query full document including content, images, snapshot
  // 5. If unlocked, query full document including content, images, media, snapshot
  let content: string | null = null;
  let signedImages: { url: string; mimeType: string }[] = [];
  let signedMedia: {
    url: string;
    mimeType: string;
    mediaType: "audio" | "video";
    duration?: number;
  } | null = null;
  let snapshot: Record<string, unknown> | null = null;

  if (isUnlocked) {
    const fullCapsule = await Capsule.findOne({
      _id: id,
      userId: session.user.id,
    })
      .select("content images media snapshot isEncrypted iv authTag")
      .lean();

    const rawContent = fullCapsule?.content || "";
    if (fullCapsule?.isEncrypted && fullCapsule.iv && fullCapsule.authTag) {
      try {
        const { decryptContent } = await import("@/lib/crypto");
        content = decryptContent(rawContent, fullCapsule.iv, fullCapsule.authTag);
      } catch (err: unknown) {
        const errorType = err instanceof Error ? err.name || "DecryptionError" : "UnknownError";
        console.error(`[Decryption Error] capsule_id=${id} error_type=${errorType}`);
        content = "Is capsule ko abhi khol nahi paaye. Thodi der baad try karo.";
      }
    } else {
      // Backward compatibility for legacy unencrypted capsules
      content = rawContent;
    }

    snapshot = fullCapsule?.snapshot || null;

    if (fullCapsule?.images && fullCapsule.images.length > 0) {
      try {
        const { generateSignedReadUrls } = await import("@/lib/storage");
        signedImages = await generateSignedReadUrls(fullCapsule.images);
      } catch (err) {
        console.error("[Storage] Failed to generate signed read URLs:", err);
      }
    }

    if (fullCapsule?.media && fullCapsule.media.key) {
      try {
        const { generateSignedMediaUrl } = await import("@/lib/storage");
        const signedUrl = await generateSignedMediaUrl(fullCapsule.media.key);
        if (signedUrl) {
          signedMedia = {
            url: signedUrl,
            mimeType: fullCapsule.media.mimeType,
            mediaType: fullCapsule.media.mediaType,
            duration: fullCapsule.media.duration,
          };
        }
      } catch (err) {
        console.error("[Storage] Failed to generate signed media URL:", err);
      }
    }
  }

  // Serialized ISO strings for client rendering
  const unlockAtIso = metadata.unlockAt.toISOString();
  const createdAtIso = metadata.createdAt.toISOString();
  const openedDate = metadata.openedEarlyAt
    ? new Date(metadata.openedEarlyAt)
    : metadata.unlockAt;
  const openedAtIso = openedDate.toISOString();

  const createdAtFormatted = metadata.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const openedAtFormatted = openedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const isOpenedToday =
    openedDate.getFullYear() === now.getFullYear() &&
    openedDate.getMonth() === now.getMonth() &&
    openedDate.getDate() === now.getDate();

  // If unlocked, render the fully animated Memories Experience wrapped in DigUpRevealer
  if (isUnlocked) {
    return (
      <DigUpRevealer capsuleId={id}>
        <MemoriesExperience
          capsuleId={id}
          title={metadata.title}
          content={content || ""}
          createdAtIso={createdAtIso}
          openedAtIso={openedAtIso}
          createdAtFormatted={createdAtFormatted}
          openedAtFormatted={openedAtFormatted}
          isOpenedToday={isOpenedToday}
          signedImages={signedImages}
          signedMedia={signedMedia}
          snapshot={snapshot}
        />
      </DigUpRevealer>
    );
  }

  // Sealed View: Ethereal Celestial Star in deep orbit
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
      {/* Ambient background bloom */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl rounded-full" />

      {/* Navigation & Controls */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted hover:text-amber-400 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Constellation</span>
        </Link>

        <DeleteCapsuleButton capsuleId={id} capsuleTitle={metadata.title} />
      </div>

      {/* Celestial Sealed Star Viewport */}
      <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-8 sm:p-14 backdrop-blur-2xl shadow-2xl text-center overflow-hidden">
        {/* Subtle celestial rings in background */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] border border-amber-400/10 rounded-full" />
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[380px] h-[380px] border border-amber-400/15 rounded-full border-dashed" />

        {/* Pulsing Star Lock Orb */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-200 text-slate-950 shadow-2xl mb-8 star-glow-amber">
          <Lock className="h-8 w-8" />
          <div className="absolute -inset-2 rounded-3xl bg-amber-400/20 blur-xl animate-pulse pointer-events-none" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-amber-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Star Capsule in Deep Orbit</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-text max-w-2xl mx-auto leading-[1.12]">
          {metadata.title}
        </h1>

        <p className="mt-4 text-xs sm:text-sm font-mono text-muted/90 max-w-lg mx-auto leading-relaxed">
          Traversing spacetime until the coordinates align on{" "}
          <LocalDateText
            dateString={unlockAtIso}
            className="text-amber-400 font-semibold"
          />
        </p>

        {/* Live Planetary Countdown */}
        <div className="my-10 flex justify-center">
          <CountdownTimer unlockAt={unlockAtIso} />
        </div>

        {/* AES-256-GCM Cryptographic Seal Guarantee */}
        <div className="rounded-2xl border border-border/80 bg-card/40 p-5 text-xs text-muted max-w-lg mx-auto text-left flex items-start gap-3.5 backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-text font-mono text-[11px] uppercase tracking-wider">
              AES-256-GCM Cryptographic Vault
            </p>
            <p className="text-[11px] leading-relaxed text-muted/80 font-light">
              This message is AES-256-GCM encrypted at rest, aur unlock se pehle content server se bheja hi nahi jata. Database queries strictly omit payload fields until the verified server clock passes the unlock timestamp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
