"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Archive,
  Lock,
  Unlock,
  Calendar,
  UserPlus,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface StatsData {
  totalUsers: number;
  newUsersLast7Days: number;
  totalCapsules: number;
  lockedCapsules: number;
  unlockedCapsules: number;
  openingNext7Days: number;
  signupsLast30Days: { date: string; count: number }[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error("Failed to load metrics from server.");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Error fetching metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const maxDailySignups = stats?.signupsLast30Days?.length
    ? Math.max(1, ...stats.signupsLast30Days.map((d) => d.count))
    : 1;

  return (
    <div className="space-y-8">
      {/* Top Header / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Command Overview
          </h1>
          <p className="mt-1 text-xs font-mono text-muted tracking-wide uppercase">
            Live metrics & telemetry across the Time Capsule network
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted transition hover:bg-border/30 hover:text-text cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-500 dark:text-rose-400">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-xs transition hover:border-accent/40">
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text">
            {loading ? "..." : stats?.totalUsers.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-500">
            <UserPlus className="h-3 w-3" />
            <span>+{stats?.newUsersLast7Days || 0} past 7 days</span>
          </div>
        </div>

        {/* New in Last 7 Days */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-xs transition hover:border-accent/40">
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider">New (7 Days)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text">
            {loading ? "..." : stats?.newUsersLast7Days.toLocaleString()}
          </p>
          <p className="mt-2 text-[11px] font-mono text-muted">
            Recent velocity
          </p>
        </div>

        {/* Total Capsules */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-xs transition hover:border-accent/40">
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Capsules</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Archive className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text">
            {loading ? "..." : stats?.totalCapsules.toLocaleString()}
          </p>
          <p className="mt-2 text-[11px] font-mono text-muted">
            All stored stars
          </p>
        </div>

        {/* Locked vs Unlocked */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-xs transition hover:border-accent/40">
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider">Locked / Unlocked</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold text-amber-400">
              {loading ? "..." : stats?.lockedCapsules}
            </p>
            <span className="text-muted text-xs font-mono">/</span>
            <p className="font-display text-xl font-medium text-muted">
              {loading ? "..." : stats?.unlockedCapsules}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-muted">
            <span className="inline-flex items-center gap-1 text-amber-400">
              <Lock className="h-2.5 w-2.5" /> Locked
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Unlock className="h-2.5 w-2.5" /> Opened
            </span>
          </div>
        </div>

        {/* Opening in Next 7 Days */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-xl shadow-xs transition hover:border-accent/40">
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider">Next 7 Days</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text">
            {loading ? "..." : stats?.openingNext7Days.toLocaleString()}
          </p>
          <p className="mt-2 text-[11px] font-mono text-sky-500">
            Pending unlocking
          </p>
        </div>
      </div>

      {/* 30-Day Signups-Per-Day Chart */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span>User Signups (Last 30 Days)</span>
            </h2>
            <p className="text-xs font-mono text-muted mt-0.5">
              Daily registration velocity over the trailing 30-day window
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hoveredDay ? (
              <div className="rounded-xl bg-accent/15 border border-accent/30 px-3 py-1 font-mono text-xs text-accent-text flex items-center gap-2">
                <span className="font-bold">{hoveredDay.count} signups</span>
                <span className="text-muted">•</span>
                <span>{hoveredDay.date}</span>
              </div>
            ) : (
              <span className="text-xs font-mono text-muted">
                Hover bars for details
              </span>
            )}
          </div>
        </div>

        {/* Interactive SVG / CSS Bar Chart */}
        <div className="relative pt-6">
          {loading ? (
            <div className="h-56 flex items-center justify-center text-xs font-mono text-muted">
              Loading cosmic registration data...
            </div>
          ) : stats?.signupsLast30Days?.length ? (
            <div>
              {/* Bars container */}
              <div className="flex items-end gap-1.5 sm:gap-2 h-48 w-full border-b border-border pb-2 px-1">
                {stats.signupsLast30Days.map((day, idx) => {
                  const heightPercent = Math.max(
                    6,
                    Math.round((day.count / maxDailySignups) * 100)
                  );
                  const isHovered = hoveredDay?.date === day.date;

                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="group relative flex-1 flex flex-col justify-end items-center h-full cursor-pointer"
                    >
                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-200 ${
                          isHovered
                            ? "bg-amber-400 shadow-md shadow-amber-400/30"
                            : day.count > 0
                            ? "bg-accent/80 hover:bg-accent"
                            : "bg-border/40 hover:bg-border/80"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between text-[10px] font-mono text-muted pt-2 px-1">
                <span>{stats.signupsLast30Days[0]?.date}</span>
                <span>{stats.signupsLast30Days[14]?.date}</span>
                <span>{stats.signupsLast30Days[29]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-muted">
              No registration activity recorded in the past 30 days.
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl transition hover:border-accent/40 hover:bg-card"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h3 className="font-display font-bold text-text group-hover:text-accent transition-colors">
                Manage User Registry
              </h3>
            </div>
            <p className="text-xs font-mono text-muted">
              Search users, inspect capsules, toggle suspension, or purge accounts.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/capsules"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl transition hover:border-accent/40 hover:bg-card"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-accent" />
              <h3 className="font-display font-bold text-text group-hover:text-accent transition-colors">
                Time Capsule Vault
              </h3>
            </div>
            <p className="text-xs font-mono text-muted">
              Filter by status, inspect temporal metadata, or delete inappropriate content.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
