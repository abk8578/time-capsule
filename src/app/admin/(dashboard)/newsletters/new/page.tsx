"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Edit3,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { slugifyTitle } from "@/lib/utils";

export default function NewNewsletterPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedSlug = slugifyTitle(title);

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      setError("Please provide a title for the newsletter.");
      return;
    }
    if (!content.trim()) {
      setError("Please write some content before saving.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          status: targetStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save newsletter.");
      }

      router.push("/admin/newsletters");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving.");
      setSaving(false);
    }
  };

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
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Compose Newsletter
          </h1>
          <p className="text-sm text-muted font-light mt-1">
            Author an editorial dispatch in Markdown. Preview your layout before publishing.
          </p>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-text hover:border-accent hover:text-accent transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save as Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-md hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{saving ? "Publishing..." : "Publish"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title Input & Slug Preview */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <label
          htmlFor="newsletter-title"
          className="block text-xs font-mono uppercase tracking-wider text-muted"
        >
          Newsletter Title
        </label>
        <input
          id="newsletter-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Whispers Across the Event Horizon #12"
          className="w-full rounded-xl border border-border bg-bg/50 px-4 py-3 text-base sm:text-lg font-medium text-text placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
        />
        {title.trim() && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
            <span className="text-muted/70">Generated Slug:</span>
            <span className="text-accent font-semibold">/newsletters/{estimatedSlug}</span>
          </div>
        )}
      </div>

      {/* Markdown Content Section */}
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
              placeholder="Write your cosmic dispatch in Markdown...&#10;&#10;## Cosmic Chronicles&#10;In this edition, we explore how time locks safeguard historical truth...&#10;&#10;- Feature updates&#10;- Starlit writing prompts&#10;- Reflections on posterity"
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
                  <span>Nothing to preview yet. Switch back to Write to add content.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Link
          href="/admin/newsletters"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-mono text-muted hover:text-text transition"
        >
          Cancel
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-text hover:border-accent hover:text-accent transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save as Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-md hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{saving ? "Publishing..." : "Publish"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
