"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  Lock,
  MailOpen,
  ArrowRight,
  PlusCircle,
  Clock,
  Calendar,
  Grid,
  Compass,
  Send,
} from "lucide-react";
import type { SealedCapsuleDTO, OpenedCapsuleDTO } from "@/types";
import CountdownTimer from "@/components/CountdownTimer";
import LocalDateText from "@/components/LocalDateText";
import { useIsMounted } from "@/hooks/useIsMounted";

let cachedClientTime = 0;
const clockListeners = new Set<() => void>();
let clockInterval: ReturnType<typeof setInterval> | null = null;

function notifyClock() {
  cachedClientTime = Date.now();
  clockListeners.forEach((fn) => fn());
}

function subscribeToClock(callback: () => void) {
  if (cachedClientTime === 0 && typeof window !== "undefined") {
    cachedClientTime = Date.now();
  }
  clockListeners.add(callback);
  if (!clockInterval && typeof window !== "undefined") {
    clockInterval = setInterval(notifyClock, 10000);
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  };
}

function getClientTime() {
  if (cachedClientTime === 0 && typeof window !== "undefined") {
    cachedClientTime = Date.now();
  }
  return cachedClientTime;
}

function getServerTime() {
  return 0;
}

interface ConstellationDashboardProps {
  sealedCapsules: SealedCapsuleDTO[];
  openedCapsules: OpenedCapsuleDTO[];
}

export default function ConstellationDashboard({
  sealedCapsules,
  openedCapsules,
}: ConstellationDashboardProps) {
  const isMounted = useIsMounted();
  const nowTime = useSyncExternalStore(subscribeToClock, getClientTime, getServerTime);
  const [activeTab, setActiveTab] = useState<"all" | "sealed" | "opened">("all");
  const [viewMode, setViewMode] = useState<"sky" | "cards">("sky");

  // Schedule exact timeout for the next upcoming capsule unlock (recomputed on each nowTime change/tick)
  useEffect(() => {
    const currentMs = nowTime > 0 ? nowTime : Date.now();
    const nextUnlockTimes = sealedCapsules
      .map((c) => new Date(c.unlockAt).getTime())
      .filter((t) => t > currentMs);
    const nextUnlock = nextUnlockTimes.length > 0 ? Math.min(...nextUnlockTimes) : null;

    if (nextUnlock && nextUnlock - currentMs < 30000 && nextUnlock - currentMs > 0) {
      const timer = setTimeout(notifyClock, nextUnlock - currentMs + 100);
      return () => clearTimeout(timer);
    }
  }, [sealedCapsules, nowTime]);

  // Live partition: SSR/pre-mount uses exact props to eliminate hydration mismatch
  const liveSealed = useMemo(() => {
    if (!isMounted || nowTime === 0) return sealedCapsules;
    return sealedCapsules.filter((c) => new Date(c.unlockAt).getTime() > nowTime);
  }, [sealedCapsules, nowTime, isMounted]);

  const newlyUnlocked: OpenedCapsuleDTO[] = useMemo(() => {
    if (!isMounted || nowTime === 0) return [];
    return sealedCapsules
      .filter((c) => new Date(c.unlockAt).getTime() <= nowTime)
      .map((c) => ({
        id: c.id,
        title: c.title,
        unlockAt: c.unlockAt,
        createdAt: c.createdAt,
        isUnlocked: true as const,
      }));
  }, [sealedCapsules, nowTime, isMounted]);

  const liveOpened = useMemo(() => {
    return [...newlyUnlocked, ...openedCapsules];
  }, [newlyUnlocked, openedCapsules]);

  const totalCount = liveSealed.length + liveOpened.length;

  const filteredSealed =
    activeTab === "all" || activeTab === "sealed" ? liveSealed : [];
  const filteredOpened =
    activeTab === "all" || activeTab === "opened" ? liveOpened : [];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Background starlight haze */}
      <div className="pointer-events-none absolute -top-32 left-1/3 w-[600px] h-[350px] bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-1/2 right-10 w-[500px] h-[300px] bg-gradient-to-tl from-indigo-500/5 via-amber-500/5 to-transparent blur-3xl rounded-full" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-400/90">
              Personal Sky Chart
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-text">
            Your Constellation of Time
          </h1>
          <p className="mt-2 text-sm text-muted font-light max-w-xl">
            Every capsule is a star suspended in spacetime. Watch them travel along their orbital paths until the dawn of unlock.
          </p>
        </div>

        {/* Action & View Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-2xl border border-border bg-card/60 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode("sky")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                viewMode === "sky"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "text-muted hover:text-text"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Sky Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "text-muted hover:text-text"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Stellar Archive</span>
            </button>
          </div>

          <Link
            href="/capsules/new"
            id="dashboard-new-capsule"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-lg transition hover:brightness-110 active:scale-[0.98] star-glow-amber cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Ignite New Star</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      {totalCount > 0 && (
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-text text-bg font-semibold"
                  : "border border-border bg-card/40 text-muted hover:text-text"
              }`}
            >
              All Stars ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sealed")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                activeTab === "sealed"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "border border-border bg-card/40 text-muted hover:text-text"
              }`}
            >
              Sealed Orbits ({sealedCapsules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("opened")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                activeTab === "opened"
                  ? "bg-slate-200 text-slate-950 font-semibold shadow-sm"
                  : "border border-border bg-card/40 text-muted hover:text-text"
              }`}
            >
              Revealed Beacons ({openedCapsules.length})
            </button>
          </div>

          <div className="text-[11px] font-mono text-muted/80">
            Coordinates validated by server clock
          </div>
        </div>
      )}

      {/* Overall Empty State */}
      {totalCount === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center max-w-lg mx-auto p-10 rounded-3xl border border-dashed border-border/80 bg-card/40 backdrop-blur-xl"
        >
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl"
            />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/90">
            Quiet Zenith
          </span>
          <h2 className="mt-2 font-display text-2xl font-normal text-text">
            Your Sky is Waiting for Its First Star
          </h2>
          <p className="mt-2 text-xs text-muted leading-relaxed font-light">
            No memories are in orbit yet. Cast a message into deep spacetime, seal it with private coordinates, and watch your night sky come alive.
          </p>

          <Link
            href="/capsules/new"
            className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 text-xs font-mono uppercase tracking-wider text-slate-950 font-semibold shadow-xl transition hover:brightness-110 active:scale-[0.98] star-glow-amber"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Ignite Your First Capsule Star</span>
          </Link>
        </motion.div>
      ) : viewMode === "sky" ? (
        /* Constellation Sky Chart View */
        <div className="mt-8 space-y-10">
          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card/70 via-card/40 to-card/20 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden min-h-[420px]">
            {/* Celestial grid background lines */}
            <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="pointer-events-none absolute inset-0 border border-border/40 rounded-3xl m-3 border-dashed" />

            <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-text">
                  Celestial Sky Map
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted">
                {totalCount} Active {totalCount === 1 ? "Star" : "Stars"} in Orbit
              </span>
            </div>

            {/* Plotted Stars */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSealed.map((capsule, index) => {
                const targetTime = new Date(capsule.unlockAt).getTime();
                const diffMs = targetTime - nowTime;
                const isUnlockingSoon = diffMs > 0 && diffMs < 60 * 60 * 1000;

                return (
                  <motion.div
                    key={capsule.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${
                      isUnlockingSoon
                        ? "border-amber-400/70 bg-amber-500/10 star-glow-amber"
                        : "border-border/80 bg-card/60 hover:border-amber-500/40 hover:bg-card/80"
                    }`}
                  >
                    {/* Pulsing Aura if unlocking in < 1 hour */}
                    {isUnlockingSoon && (
                      <div className="absolute -inset-0.5 rounded-2xl bg-amber-400/20 blur-md animate-pulse pointer-events-none" />
                    )}

                    <div className="relative flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                            isUnlockingSoon
                              ? "bg-amber-400 text-slate-950 shadow-md animate-bounce"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-semibold block">
                            {isUnlockingSoon ? "Approaching Horizon (<1h)" : "Sealed Orbit"}
                          </span>
                        </div>
                      </div>

                      <CountdownTimer unlockAt={capsule.unlockAt} compact />
                    </div>

                    <h3 className="font-display text-lg font-normal text-text line-clamp-2 group-hover:text-amber-300 transition-colors">
                      {capsule.title}
                    </h3>

                    {capsule.recipientEmail && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-indigo-300">
                        <Send className="h-3 w-3 shrink-0" />
                        <span className="truncate">For: {capsule.recipientEmail}</span>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted">
                      <span>
                        Alignment:{" "}
                        <LocalDateText
                          dateString={capsule.unlockAt}
                          options={{ month: "short", day: "numeric", year: "numeric" }}
                        />
                      </span>

                      <Link
                        href={`/capsules/${capsule.id}`}
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition group-hover:translate-x-0.5"
                      >
                        <span>Coordinates</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}

              {filteredOpened.map((capsule, index) => (
                <motion.div
                  key={capsule.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/50 p-5 hover:border-slate-300/60 hover:bg-card/90 transition-all duration-300 backdrop-blur-md star-glow-white"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/20 text-slate-100 border border-slate-300/30">
                        <MailOpen className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">
                        Revealed Beacon
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <LocalDateText
                        dateString={capsule.unlockAt}
                        options={{ month: "short", day: "numeric" }}
                      />
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-normal text-text line-clamp-2 group-hover:text-amber-200 transition-colors">
                    {capsule.title}
                  </h3>

                  {capsule.content && (
                    <p className="mt-2 text-xs text-muted/80 line-clamp-2 font-light leading-relaxed">
                      {capsule.content}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted">
                    <span>Dawn of Revelation</span>
                    <Link
                      href={`/capsules/${capsule.id}`}
                      className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition group-hover:translate-x-0.5 font-semibold"
                    >
                      <span>Enter Orbit</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Stellar Archive / Detailed Cards View */
        <div className="mt-8 space-y-12">
          {filteredSealed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <h2 className="font-display text-xl text-text">
                  Sealed Stars in Orbit
                </h2>
                <span className="ml-2 rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs font-mono text-muted">
                  {filteredSealed.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSealed.map((capsule) => (
                  <StellarCard key={capsule.id} capsule={capsule} />
                ))}
              </div>
            </section>
          )}

          {filteredOpened.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-200/20 text-slate-100 border border-slate-300/30">
                  <MailOpen className="h-3.5 w-3.5" />
                </div>
                <h2 className="font-display text-xl text-text">
                  Revealed Memory Beacons
                </h2>
                <span className="ml-2 rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs font-mono text-muted">
                  {filteredOpened.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOpened.map((capsule) => (
                  <StellarCard key={capsule.id} capsule={capsule} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StellarCard({
  capsule,
}: {
  capsule: SealedCapsuleDTO | OpenedCapsuleDTO;
}) {
  const isSealed = !capsule.isUnlocked;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card/50 p-6 backdrop-blur-md shadow-md transition-all duration-300 hover:border-amber-500/40 hover:bg-card/80">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          {isSealed ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-400">
              <Lock className="h-3 w-3" />
              Sealed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/30 bg-slate-200/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-200">
              <MailOpen className="h-3 w-3" />
              Revealed
            </span>
          )}

          {isSealed ? (
            <CountdownTimer unlockAt={capsule.unlockAt} compact />
          ) : (
            <span className="text-[11px] font-mono text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <LocalDateText
                dateString={capsule.unlockAt}
                options={{ month: "short", day: "numeric", year: "numeric" }}
              />
            </span>
          )}
        </div>

        <h3 className="font-display text-xl text-text line-clamp-2 group-hover:text-amber-300 transition-colors">
          {capsule.title}
        </h3>

        {isSealed && "recipientEmail" in capsule && capsule.recipientEmail && (
          <div className="mt-2 text-xs font-mono text-indigo-300 flex items-center gap-1.5">
            <Send className="h-3 w-3 shrink-0" />
            <span className="truncate">For: {capsule.recipientEmail}</span>
          </div>
        )}

        {!isSealed && "content" in capsule && capsule.content && (
          <p className="mt-3 text-xs text-muted font-light line-clamp-3 leading-relaxed">
            {capsule.content}
          </p>
        )}

        {isSealed && (
          <div className="mt-4 text-xs font-mono text-muted/80 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-400/80" />
            <span>Unlocks on </span>
            <LocalDateText
              dateString={capsule.unlockAt}
              className="text-text font-semibold"
            />
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
          Sealed{" "}
          <LocalDateText
            dateString={capsule.createdAt}
            options={{ month: "short", day: "numeric", year: "numeric" }}
          />
        </span>

        <Link
          href={`/capsules/${capsule.id}`}
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 transition"
        >
          <span>{isSealed ? "Coordinates" : "Read Memory"}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
