"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Archive,
  Search,
  Filter,
  Trash2,
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Mic,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";

interface AdminCapsule {
  id: string;
  title: string;
  unlockAt: string;
  createdAt: string;
  isUnlocked: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  recipientEmail?: string | null;
  recipientName?: string | null;
  imageCount: number;
  hasAudio: boolean;
  openedEarlyAt?: string | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminCapsulesPage() {
  const [capsules, setCapsules] = useState<AdminCapsule[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Notifications & Actions
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCapsule | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchCapsules = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    setActionError(null);
    try {
      const query = new URLSearchParams({
        page: String(pageToLoad),
        limit: "10",
        status: statusFilter,
        search: search.trim(),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      });

      const res = await fetch(`/api/admin/capsules?${query.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load capsule records.");
      }
      const data = await res.json();
      setCapsules(data.capsules || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err: any) {
      setActionError(err?.message || "Failed to retrieve capsules.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, fromDate, toDate]);

  useEffect(() => {
    fetchCapsules(1);
  }, [fetchCapsules]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCapsules(1);
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  const handleDeleteCapsule = async () => {
    if (!deleteTarget) return;
    setActionProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/capsules/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete capsule.");
      }

      setActionSuccess(data.message || `Capsule "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      fetchCapsules(pagination.page);
    } catch (err: any) {
      setActionError(err.message || "Failed to purge capsule.");
    } finally {
      setActionProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Time Capsule Vault
          </h1>
          <p className="mt-1 text-xs font-mono text-muted tracking-wide uppercase">
            Inspect temporal metadata, monitor delivery schedules, and remove inappropriate content
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchCapsules(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted transition hover:bg-border/30 hover:text-text cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-500 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-500 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Privacy Guarantee Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-accent-text">
        <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
        <p className="font-mono">
          <strong>Privacy Shield Active:</strong> Private capsule message content, images, and audio notes are strictly excluded from admin queries at the database layer. Only temporal metadata is accessible.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by capsule title, creator, or recipient email..."
              className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2 text-xs font-mono text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-mono text-text focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="locked">Locked Only</option>
              <option value="unlocked">Unlocked Only</option>
            </select>
          </div>

          {/* From Date */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted uppercase">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-border bg-card/80 px-2.5 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted uppercase">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-border bg-card/80 px-2.5 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-text hover:bg-border/30 transition cursor-pointer"
            >
              Filter
            </button>
            {(search || statusFilter !== "all" || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl px-3 py-2 text-xs font-mono text-muted hover:text-text cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Capsules Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-card/80 font-mono text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-5 py-3.5">Title & Creator</th>
                <th scope="col" className="px-5 py-3.5">Recipient</th>
                <th scope="col" className="px-5 py-3.5">Unlock Target</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Attachments</th>
                <th scope="col" className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && capsules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-mono text-muted">
                    Loading vault metadata from database...
                  </td>
                </tr>
              ) : capsules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-mono text-muted">
                    No capsules found matching current filters.
                  </td>
                </tr>
              ) : (
                capsules.map((c) => {
                  const unlockDate = new Date(c.unlockAt);
                  const isUnlocked = c.isUnlocked;

                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-card/60"
                    >
                      {/* Title & Creator */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-text truncate max-w-[220px]">
                            {c.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
                            <User className="h-3 w-3 text-accent" />
                            <span className="truncate max-w-[180px]">{c.creator.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="px-5 py-4 font-mono text-[11px] text-muted whitespace-nowrap">
                        {c.recipientEmail ? (
                          <div className="space-y-0.5">
                            <span className="text-text block truncate max-w-[160px]">
                              {c.recipientEmail}
                            </span>
                            {c.recipientName && (
                              <span className="text-[10px] text-muted block">
                                ({c.recipientName})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-muted/60">Self only</span>
                        )}
                      </td>

                      {/* Unlock Date */}
                      <td className="px-5 py-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-text block">
                            {unlockDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-muted block">
                            {unlockDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZoneName: "short",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-400">
                            <Unlock className="h-3 w-3" />
                            Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-400">
                            <Lock className="h-3 w-3" />
                            Sealed
                          </span>
                        )}
                      </td>

                      {/* Attachments */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-muted">
                        <div className="flex items-center gap-2">
                          {c.imageCount > 0 ? (
                            <span
                              title={`${c.imageCount} attached image(s)`}
                              className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-1.5 py-0.5 text-text"
                            >
                              <ImageIcon className="h-3 w-3 text-sky-400" />
                              {c.imageCount}
                            </span>
                          ) : (
                            <span className="text-muted/40">-</span>
                          )}

                          {c.hasAudio && (
                            <span
                              title="Voice audio attached"
                              className="inline-flex items-center rounded-md bg-purple-500/15 border border-purple-500/30 p-1 text-purple-400"
                            >
                              <Mic className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Purge inappropriate capsule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4 font-mono text-xs text-muted">
          <span>
            Total: {pagination.total} capsule{pagination.total !== 1 ? "s" : ""}
          </span>

          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchCapsules(pagination.page - 1)}
                className="rounded-lg border border-border bg-card p-1 text-muted hover:text-text disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchCapsules(pagination.page + 1)}
                className="rounded-lg border border-border bg-card p-1 text-muted hover:text-text disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Delete Capsule */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <Trash2 className="h-6 w-6" />
              <h3 className="font-display text-lg font-bold text-text">
                Delete Inappropriate Capsule
              </h3>
            </div>

            <p className="text-xs text-rose-400/90 leading-relaxed mb-4">
              Confirm purge of capsule{" "}
              <strong className="text-text font-mono">"{deleteTarget.title}"</strong> created by{" "}
              <strong className="text-text font-mono">{deleteTarget.creator.email}</strong>?
            </p>

            <p className="text-xs font-mono text-muted mb-6">
              This action will remove the database record and delete any media attachments from Supabase storage permanently.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionProcessing}
                className="rounded-xl border border-border bg-card px-4 py-2 font-mono text-xs uppercase text-muted hover:text-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCapsule}
                disabled={actionProcessing}
                className="rounded-xl bg-rose-500 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-white hover:bg-rose-600 cursor-pointer disabled:opacity-50"
              >
                {actionProcessing ? "Purging..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
