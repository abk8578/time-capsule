"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { slugifyTitle } from "@/lib/utils";

interface NewsletterEditProps {
  params: Promise<{ id: string }>;
}

export default function EditNewsletterPage({ params }: NewsletterEditProps) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Fetch current newsletter
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/newsletters/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load newsletter data.");
        }
        const data = await res.json();
        if (isMounted && data.newsletter) {
          setTitle(data.newsletter.title);
          setContent(data.newsletter.content);
          setSlug(data.newsletter.slug);
          setStatus(data.newsletter.status);
          setPublishedAt(data.newsletter.publishedAt);
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || "Error loading newsletter.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdate = async (targetStatus?: "draft" | "published") => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const nextStatus = targetStatus || status;

    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update newsletter.");
      }

      setSlug(data.newsletter.slug);
      setStatus(data.newsletter.status);
      setPublishedAt(data.newsletter.publishedAt);
      setSuccess("Newsletter successfully saved.");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to save newsletter.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this newsletter?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete newsletter.");
      }
      router.push("/admin/newsletters");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to delete newsletter.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-muted font-mono text-xs">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
        <span>Loading dispatch data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <Link
            href="/admin/newsletters"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-text transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Newsletters</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Edit Newsletter
            </h1>
            {status === "published" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                Draft
              </span>
            )}
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {status === "published" && (
            <Link
              href={`/newsletters/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono text-muted hover:text-text hover:border-accent transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View Public</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleUpdate("draft")}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-text hover:border-accent hover:text-accent transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdate("published")}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-md hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{status === "published" ? "Update Published" : "Publish Now"}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title & Slug Preview */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <label
          htmlFor="edit-newsletter-title"
          className="block text-xs font-mono uppercase tracking-wider text-muted"
        >
          Newsletter Title
        </label>
        <input
          id="edit-newsletter-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dispatch title..."
          className="w-full rounded-xl border border-border bg-bg/50 px-4 py-3 text-base sm:text-lg font-medium text-text placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-muted/70">Public Slug:</span>
            <span className="text-accent font-semibold">/newsletters/{slug}</span>
          </div>
          {publishedAt && (
            <div className="flex items-center gap-1 text-muted/80">
              <Calendar className="h-3 w-3" />
              <span>Published: {new Date(publishedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Editor */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Editor Tab Switcher */}
        <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition cursor-pointer ${
                activeTab === "write"
                  ? "bg-accent/15 text-accent font-semibold border border-accent/25"
                  : "text-muted hover:text-text"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Write (Markdown)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition cursor-pointer ${
                activeTab === "preview"
                  ? "bg-accent/15 text-accent font-semibold border border-accent/25"
                  : "text-muted hover:text-text"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-muted hidden sm:inline">
            Supports GitHub Flavored Markdown
          </span>
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {activeTab === "write" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="w-full rounded-xl border border-border bg-bg/50 p-4 font-mono text-xs sm:text-sm text-text placeholder:text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none leading-relaxed resize-y"
            />
          ) : (
            <div className="min-h-[360px] rounded-xl border border-border bg-bg/30 p-6">
              {content.trim() ? (
                <div className="prose prose-invert max-w-none text-text space-y-4 font-sans leading-relaxed text-sm">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <div className="py-16 text-center text-muted font-mono text-xs">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-muted/40" />
                  <span>Nothing to preview. Switch to Write to edit content.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions & Danger Zone */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-mono text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{deleting ? "Deleting..." : "Delete Newsletter"}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleUpdate("draft")}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-text hover:border-accent hover:text-accent transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdate("published")}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-md hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : status === "published" ? "Save & Publish" : "Publish"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
