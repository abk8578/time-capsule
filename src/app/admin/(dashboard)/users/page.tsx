"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Clock,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  capsuleCount: number;
  lockedCount: number;
  unlockedCount: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Confirm Modals State
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchUsers = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    setActionError(null);
    try {
      const query = new URLSearchParams({
        page: String(pageToLoad),
        limit: "10",
        search: search.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/users?${query.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load user records.");
      }
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err: any) {
      setActionError(err?.message || "Failed to retrieve user registry.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleSuspend = async () => {
    if (!suspendTarget) return;
    setActionProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const action = suspendTarget.isSuspended ? "unsuspend" : "suspend";

    try {
      const res = await fetch(`/api/admin/users/${suspendTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed.");
      }

      setActionSuccess(data.message || "User status updated successfully.");
      setSuspendTarget(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setActionError(err.message || "Failed to update suspension status.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setActionProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }

      setActionSuccess(data.message || "User and associated capsules purged.");
      setDeleteTarget(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setActionError(err.message || "Failed to execute account deletion.");
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
            User Registry
          </h1>
          <p className="mt-1 text-xs font-mono text-muted tracking-wide uppercase">
            Search, suspend, or purge user accounts and monitor their capsules
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers(pagination.page)}
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name or email..."
              className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2 text-xs font-mono text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-text hover:bg-border/30 transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-mono text-text focus:border-accent focus:outline-none cursor-pointer"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-card/80 font-mono text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-5 py-3.5">User</th>
                <th scope="col" className="px-5 py-3.5">Joined</th>
                <th scope="col" className="px-5 py-3.5">Capsules</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-mono text-muted">
                    Loading registry from database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-mono text-muted">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentAdmin = u.id === currentUserId;
                  const isOtherAdmin = u.role === "admin";
                  const isProtected = isCurrentAdmin || isOtherAdmin;

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-card/60"
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/25 text-accent-text font-bold text-xs uppercase font-mono">
                            {u.name ? u.name.charAt(0) : "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text truncate max-w-[180px]">
                                {u.name}
                              </span>
                              {u.role === "admin" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400">
                                  <Shield className="h-2.5 w-2.5" />
                                  Admin
                                </span>
                              )}
                              {isCurrentAdmin && (
                                <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-mono text-blue-400">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-muted truncate block max-w-[220px]">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-4 font-mono text-[11px] text-muted whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Capsule Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs">
                          <span className="font-bold text-text">{u.capsuleCount}</span>
                          <span className="text-[10px] text-muted ml-1.5">
                            ({u.lockedCount} locked, {u.unlockedCount} open)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {u.isSuspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 font-mono text-[10px] font-semibold text-rose-500">
                            <XCircle className="h-3 w-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isProtected ? (
                          <span className="font-mono text-[10px] text-muted italic inline-flex items-center gap-1">
                            <Shield className="h-3 w-3 text-amber-500/70" />
                            Protected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Suspend / Unsuspend */}
                            <button
                              type="button"
                              onClick={() => setSuspendTarget(u)}
                              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition border cursor-pointer ${
                                u.isSuspended
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                              }`}
                            >
                              {u.isSuspended ? "Unsuspend" : "Suspend"}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(u)}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Delete user and their capsules"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4 font-mono text-xs text-muted">
          <span>
            Total: {pagination.total} account{pagination.total !== 1 ? "s" : ""}
          </span>

          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="rounded-lg border border-border bg-card p-1 text-muted hover:text-text disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="rounded-lg border border-border bg-card p-1 text-muted hover:text-text disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Suspend / Unsuspend */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-display text-lg font-bold text-text">
                {suspendTarget.isSuspended ? "Reactivate User Account" : "Suspend User Account"}
              </h3>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-6 font-mono">
              {suspendTarget.isSuspended
                ? `Reactivating ${suspendTarget.email} will restore their login access and allow capsule creation.`
                : `Suspending ${suspendTarget.email} will immediately terminate active sessions, block future logins, and forbid capsule creation.`}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                disabled={actionProcessing}
                className="rounded-xl border border-border bg-card px-4 py-2 font-mono text-xs uppercase text-muted hover:text-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleSuspend}
                disabled={actionProcessing}
                className={`rounded-xl px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold cursor-pointer ${
                  suspendTarget.isSuspended
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                }`}
              >
                {actionProcessing
                  ? "Processing..."
                  : suspendTarget.isSuspended
                  ? "Confirm Reactivation"
                  : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete User */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <Trash2 className="h-6 w-6" />
              <h3 className="font-display text-lg font-bold text-text">
                Permanently Delete User
              </h3>
            </div>

            <p className="text-xs text-rose-400/90 leading-relaxed mb-4">
              Warning: This is an irreversible operation. Deleting{" "}
              <strong className="text-text font-mono">{deleteTarget.email}</strong> will
              permanently erase:
            </p>

            <ul className="list-disc pl-5 text-xs font-mono text-muted space-y-1 mb-6">
              <li>User credentials and account profile</li>
              <li>All <strong>{deleteTarget.capsuleCount}</strong> time capsules</li>
              <li>All associated storage images and recorded voice notes</li>
            </ul>

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
                onClick={handleDeleteUser}
                disabled={actionProcessing}
                className="rounded-xl bg-rose-500 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-white hover:bg-rose-600 cursor-pointer disabled:opacity-50"
              >
                {actionProcessing ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
