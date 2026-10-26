import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import LocalDateText from "@/components/LocalDateText";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  if (!token || typeof token !== "string" || token.length < 16) {
    return { title: "Time Capsule Not Found" };
  }

  await connectToDatabase();
  const capsule = await Capsule.findOne({ shareToken: token })
    .select("title unlockAt openedEarlyAt createdAt shareIncludeTitle")
    .lean();

  if (!capsule) {
    return { title: "Time Capsule Not Found" };
  }

  const now = new Date();
  const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
  if (!isUnlocked) {
    return { title: "Sealed Time Capsule" };
  }

  const appUrl = (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3001"
  ).replace(/\/+$/, "");

  const ogImageUrl = `${appUrl}/api/share/${token}/og`;
  const pageTitle = capsule.shareIncludeTitle && capsule.title
    ? `Time Capsule: "${capsule.title}"`
    : "A Memory From Across Time";

  return {
    title: `${pageTitle} | Time Capsule`,
    description: "A memory written in the past has arrived across spacetime.",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    openGraph: {
      title: pageTitle,
      description: "A memory written in the past has arrived across spacetime.",
      url: `${appUrl}/share/${token}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Time Capsule memory card",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: "A memory written in the past has arrived across spacetime.",
      images: [ogImageUrl],
    },
  };
}

export default async function PublicSharePage({ params }: SharePageProps) {
  const { token } = await params;
  if (!token || typeof token !== "string" || token.length < 16) {
    notFound();
  }

  await connectToDatabase();

  // Strict projection: NEVER select content!
  const capsule = await Capsule.findOne({ shareToken: token })
    .select("title unlockAt openedEarlyAt createdAt shareIncludeTitle")
    .lean();

  if (!capsule) {
    notFound();
  }

  const now = new Date();
  const isUnlocked = capsule.unlockAt <= now || !!capsule.openedEarlyAt;
  if (!isUnlocked) {
    notFound();
  }

  const createdDate = new Date(capsule.createdAt);
  const openedDate = capsule.openedEarlyAt
    ? new Date(capsule.openedEarlyAt)
    : new Date(capsule.unlockAt);

  const diffMs = Math.max(0, openedDate.getTime() - createdDate.getTime());
  const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const totalYears = Math.floor(totalDays / 365);
  const totalMonths = Math.floor(totalDays / 30);

  let timePhrase = "Maine kuch samay pehle yeh likha tha";
  if (totalYears >= 1) {
    timePhrase = `Maine ${totalYears} saal pehle yeh likha tha`;
  } else if (totalMonths >= 1) {
    timePhrase = `Maine ${totalMonths} mahine pehle yeh likha tha`;
  } else {
    timePhrase = `Maine ${Math.max(1, totalDays)} din pehle yeh likha tha`;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 px-4 py-16 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex flex-col justify-center items-center text-center">
      {/* Background starlight ambient glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-gradient-to-b from-amber-500/10 via-indigo-600/5 to-transparent blur-3xl rounded-full" />

      {/* Share Card Container */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-gradient-to-b from-card/90 via-card/60 to-card/90 p-8 sm:p-12 backdrop-blur-2xl shadow-2xl space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <Sparkles className="h-3.5 w-3.5" />
          <span>A Voice From Across Spacetime</span>
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-text tracking-tight">
            &ldquo;{timePhrase}&rdquo;
          </h1>

          {capsule.shareIncludeTitle && capsule.title && (
            <p className="font-display text-xl sm:text-2xl text-amber-400/90 italic">
              &mdash; {capsule.title} &mdash;
            </p>
          )}

          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto font-light leading-relaxed">
            This memory was sealed in the past, travelled through spacetime in cryptographic orbit, and has successfully unsealed.
          </p>
        </div>

        {/* Spacetime Timeline Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60 text-xs font-mono text-muted text-left">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-bg/40 border border-border/40">
            <Calendar className="h-4 w-4 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase text-muted/80 block">Sealed Coordinates</span>
              <LocalDateText dateString={createdDate.toISOString()} className="text-text font-semibold" />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-bg/40 border border-border/40">
            <Clock className="h-4 w-4 text-indigo-400" />
            <div>
              <span className="text-[10px] uppercase text-muted/80 block">Journey Traveled</span>
              <span className="text-text font-semibold">{totalDays} days in orbit</span>
            </div>
          </div>
        </div>

        {/* Security / Privacy reassurance badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted/80 pt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>The letter itself remains private to its creator and recipient.</span>
        </div>

        {/* Call To Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/capsules/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-on-accent font-semibold text-sm shadow-lg hover:opacity-90 transition cursor-pointer"
          >
            <span>Create Your Own Capsule</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card text-text text-sm font-semibold hover:border-accent transition cursor-pointer"
          >
            <span>Learn More</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
