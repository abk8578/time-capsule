import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Newsletter from "@/models/Newsletter";
import { ArrowLeft, Calendar, Sparkles, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

interface NewsletterSlugProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsletterDetailPage({ params }: NewsletterSlugProps) {
  const { slug } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/newsletters/${slug}`);
  }

  await connectToDatabase();

  // STRICT REQUIREMENT: Only published newsletters are accessible.
  // Drafts return 404, even for direct URL.
  const newsletter = await Newsletter.findOne({
    slug,
    status: "published",
  }).lean();

  if (!newsletter) {
    notFound();
  }

  const publishedDate = newsletter.publishedAt
    ? new Date(newsletter.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Decorative Galaxy Starlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-30">
        <div className="h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      </div>

      {/* Back Link */}
      <div className="mb-8">
        <Link
          href="/newsletters"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-2 text-xs font-mono text-muted hover:border-accent hover:text-text transition backdrop-blur-md"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Dispatches</span>
        </Link>
      </div>

      {/* Header Container */}
      <header className="rounded-3xl border border-border bg-card/80 p-8 sm:p-12 backdrop-blur-2xl shadow-sm space-y-6 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-accent-text">
            <Sparkles className="h-3 w-3 text-accent" />
            <span>Time Capsule Official Dispatch</span>
          </div>

          {publishedDate && (
            <div className="flex items-center gap-1.5 text-muted">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              <span>{publishedDate}</span>
            </div>
          )}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text leading-tight">
          {newsletter.title}
        </h1>

        <div className="flex items-center gap-3 pt-2 border-t border-border/60 text-xs font-mono text-muted">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-slate-950 font-bold">
            <BookOpen className="h-4 w-4" />
          </div>
          <span>Time Capsule Editorial Desk</span>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="rounded-3xl border border-border bg-card/60 p-8 sm:p-12 backdrop-blur-2xl shadow-sm">
        {/* Render sanitized markdown using react-markdown (No raw dangerouslySetInnerHTML) */}
        <div className="prose prose-invert max-w-none text-text font-sans text-base sm:text-lg leading-relaxed space-y-5">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-text mt-8 mb-4 border-b border-border/80 pb-3" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="font-display text-xl sm:text-2xl font-bold text-text mt-6 mb-3 text-accent" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="font-display text-lg font-semibold text-text mt-4 mb-2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="leading-relaxed text-muted/90 text-sm sm:text-base my-3" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1.5 my-4 text-sm sm:text-base text-muted/90 font-light" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-1.5 my-4 text-sm sm:text-base text-muted/90 font-light" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-accent pl-4 italic text-muted my-4 bg-accent/5 py-2 rounded-r-xl" {...props} />
              ),
              code: ({ node, className, children, ...props }) => {
                return (
                  <code className="rounded-md bg-muted/20 px-1.5 py-0.5 font-mono text-xs text-accent" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {newsletter.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer Return Navigation */}
      <div className="mt-10 text-center">
        <Link
          href="/newsletters"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-md hover:brightness-110 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Explore More Dispatches</span>
        </Link>
      </div>
    </article>
  );
}
