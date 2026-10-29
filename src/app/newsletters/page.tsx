import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import {
  Newspaper,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface NewslettersPageProps {
  searchParams: Promise<{ page?: string }>;
}

function createPreviewExcerpt(content: string, maxLength = 220): string {
  if (!content) return "";
  const cleaned = content
    .replace(/#+\s+/g, "") // remove headings
    .replace(/[*_~`]/g, "") // remove bold/italics
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // link labels
    .replace(/\n+/g, " ") // collapse newlines
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

export default async function NewslettersPage({
  searchParams,
}: NewslettersPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/newsletters");
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = 6;
  const skip = (page - 1) * limit;

  await connectToDatabase();

  // Mark all current newsletters as seen for this user
  await User.findByIdAndUpdate(session.user.id, {
    lastSeenNewslettersAt: new Date(),
  }).catch(() => {
    // non-fatal
  });

  // Query ONLY published newsletters (never drafts)
  const filter = { status: "published" as const };

  const [totalCount, docs] = await Promise.all([
    Newsletter.countDocuments(filter),
    Newsletter.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title slug content publishedAt createdAt")
      .lean(),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const newsletters = docs.map((doc: any) => ({
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    preview: createPreviewExcerpt(doc.content),
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
  }));

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Background Decorative Starlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-40">
        <div className="h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 text-xs font-mono text-accent-text">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Chronicles of Time Capsule</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text">
          Newsletters & Dispatches
        </h1>

        <p className="text-sm sm:text-base text-muted font-light leading-relaxed">
          Curated dispatches, celestial writing reflections, platform evolutions, and insights from across time.
        </p>
      </div>

      {/* Newsletter Grid */}
      {newsletters.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card/60 p-12 sm:p-16 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 mx-auto text-accent">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-text">
            No Dispatches Yet
          </h2>
          <p className="text-xs sm:text-sm text-muted font-mono leading-relaxed">
            The celestial printing press is preparing its next chronicle. Check back soon for starlit writing prompts and updates.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold hover:brightness-110 transition"
            >
              <span>Return to Constellation</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsletters.map((newsletter) => (
            <article
              key={newsletter.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Meta info */}
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    <span>
                      {newsletter.publishedAt
                        ? new Date(newsletter.publishedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent"}
                    </span>
                  </div>
                  <span className="rounded-md bg-accent/10 border border-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent-text uppercase tracking-wider">
                    Dispatch
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-display text-xl font-bold tracking-tight text-text group-hover:text-accent transition-colors line-clamp-2">
                  <Link href={`/newsletters/${newsletter.slug}`}>
                    {newsletter.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="text-xs text-muted font-light leading-relaxed line-clamp-4">
                  {newsletter.preview}
                </p>
              </div>

              {/* Read button */}
              <div className="pt-6 mt-4 border-t border-border/60">
                <Link
                  href={`/newsletters/${newsletter.slug}`}
                  className="inline-flex w-full items-center justify-between rounded-xl border border-border bg-card/80 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-text transition group-hover:border-accent group-hover:bg-accent/10 group-hover:text-accent"
                >
                  <span>Read Chronicle</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-3 font-mono text-xs text-muted">
          {page > 1 ? (
            <Link
              href={`/newsletters?page=${page - 1}`}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3.5 py-2 hover:border-accent hover:text-text transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/40 bg-card/40 px-3.5 py-2 text-muted/40 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </span>
          )}

          <div className="rounded-xl border border-border bg-card px-4 py-2 text-text font-semibold">
            Page {page} of {totalPages}
          </div>

          {page < totalPages ? (
            <Link
              href={`/newsletters?page=${page + 1}`}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3.5 py-2 hover:border-accent hover:text-text transition"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/40 bg-card/40 px-3.5 py-2 text-muted/40 cursor-not-allowed">
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
