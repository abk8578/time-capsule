"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Send,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Archive,
} from "lucide-react";
import AdminSelect, { SelectOption } from "@/components/admin/AdminSelect";

interface AdminNewsletter {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string;
  };
}

const statusOptions: SelectOption[] = [
  { label: "All Statuses", value: "all", icon: <Newspaper className="h-3.5 w-3.5 text-accent" /> },
  { label: "Published Only", value: "published", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
  { label: "Drafts Only", value: "draft", icon: <FileText className="h-3.5 w-3.5 text-amber-500" /> },
];

export default function AdminNewslettersPage() {
  const [newsletters, setNewsletters] = useState<AdminNewsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminNewsletter | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/newsletters");
      if (!res.ok) {
        throw new Error("Failed to load newsletter archives.");
      }
      const data = await res.json();
      setNewsletters(data.newsletters || []);
    } catch (err: any) {
      setActionError(err?.message || "Failed to retrieve newsletters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  // Toggle publish / unpublish
  const handleToggleStatus = async (item: AdminNewsletter) => {
    setActionProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    const newStatus = item.status === "published" ? "draft" : "published";

    try {
      const res = await fetch(`/api/admin/newsletters/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setActionSuccess(
        newStatus === "published"
          ? `Published "${item.title}" successfully.`
          : `Reverted "${item.title}" to draft.`
      );
      await fetchNewsletters();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update newsletter status.");
    } finally {
      setActionProcessing(false);
    }
  };

  // Delete newsletter
  const handleDeleteNewsletter = async () => {
    if (!deleteTarget) return;
    setActionProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/newsletters/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete newsletter.");
      }

      setActionSuccess(`Deleted "${deleteTarget.title}" successfully.`);
      setDeleteTarget(null);
      await fetchNewsletters();
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete newsletter.");
    } finally {
      setActionProcessing(false);
    }
  };

  // Filtered newsletters
  const filtered = newsletters.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchSlug = item.slug.toLowerCase().includes(query);
      const matchAuthor = item.author.name.toLowerCase().includes(query);
      return matchTitle || matchSlug || matchAuthor;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-mono text-accent-text mb-2">
            <Newspaper className="h-3.5 w-3.5 text-accent" />
            <span>Editorial Desk</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Newsletters & Broadcasts
          </h1>
          <p className="mt-1 text-sm text-muted font-light">
            Compose celestial dispatches, maintain editorial drafts, and publish to all registered time travelers.
          </p>
        </div>

        <Link
          href="/admin/newsletters/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-md transition hover:brightness-110 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Newsletter</span>
        </Link>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug, or author..."
            className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs font-mono text-text placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
          />
        </div>

        <div className="w-full sm:w-52">
          <AdminSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        <button
          type="button"
          onClick={() => fetchNewsletters()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-mono text-muted hover:text-text hover:border-accent transition disabled:opacity-50 cursor-pointer shrink-0"
          title="Refresh newsletters"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="relative z-10 rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-border bg-card/60 uppercase tracking-widest text-muted text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Title & Slug</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Publication Date</th>
                <th className="px-5 py-3.5">Author</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && newsletters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
                    <span>Loading newsletter chronicles...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    <Archive className="h-8 w-8 mx-auto mb-2 text-muted/40" />
                    <p className="font-medium text-text">No newsletters found.</p>
                    <p className="text-[11px] mt-1 text-muted">
                      {search || statusFilter !== "all"
                        ? "Try adjusting your filters or search keywords."
                        : "Begin by drafting your very first celestial broadcast."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/5 transition-colors group"
                  >
                    {/* Title & Slug */}
                    <td className="px-5 py-4">
                      <div className="font-sans font-medium text-text text-sm group-hover:text-accent transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-muted/60">/newsletters/</span>
                        <span className="text-accent/90">{item.slug}</span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-4">
                      {item.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted/60 shrink-0" />
                        <span>
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : `Created: ${new Date(item.createdAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-5 py-4 text-muted">
                      <span className="text-text font-medium">{item.author.name}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick View if Published */}
                        {item.status === "published" && (
                          <Link
                            href={`/newsletters/${item.slug}`}
                            target="_blank"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-text hover:border-accent transition cursor-pointer"
                            title="View Public Page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Toggle Publish */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={actionProcessing}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-mono tracking-wider uppercase transition cursor-pointer disabled:opacity-50 ${
                            item.status === "published"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                          title={item.status === "published" ? "Unpublish to Draft" : "Publish to Readers"}
                        >
                          <Send className="h-3 w-3" />
                          <span>{item.status === "published" ? "Unpublish" : "Publish"}</span>
                        </button>

                        {/* Edit */}
                        <Link
                          href={`/admin/newsletters/${item.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-text hover:border-accent transition cursor-pointer"
                          title="Edit Newsletter"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={actionProcessing}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-rose-500 hover:border-rose-500/40 transition cursor-pointer"
                          title="Delete Newsletter"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-text">
                Confirm Newsletter Deletion
              </h3>
            </div>

            <p className="text-xs text-muted leading-relaxed font-mono">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-text">
                &ldquo;{deleteTarget.title}&rdquo;
              </span>
              ? This action cannot be undone, and the slug{" "}
              <span className="text-accent font-mono">/{deleteTarget.slug}</span> will be unlinked.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionProcessing}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono text-muted hover:text-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteNewsletter}
                disabled={actionProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-mono text-white font-semibold hover:bg-rose-500 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{actionProcessing ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
