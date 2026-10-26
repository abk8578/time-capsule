"use client";

import React, { useState } from "react";
import {
  Lock,
  Unlock,
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  Mail,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
} from "lucide-react";

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<"sealed" | "unlocked">("sealed");

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Background glow orb */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-500/10 blur-[140px] -z-10" />

      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="saas-badge mb-3">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Interactive Time Machine</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
          Experience The Moment of Unlock
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted font-light max-w-xl mx-auto leading-relaxed">
          Toggle between an in-flight locked capsule and the unforgettable emotional moment when your future self receives it.
        </p>
      </div>

      {/* Interactive Switcher Toggle (Linear Style) */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center p-1.5 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("sealed")}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-mono tracking-wider cursor-pointer transition-all ${
              activeTab === "sealed"
                ? "bg-accent text-slate-950 font-bold shadow-md"
                : "text-muted hover:text-text hover:bg-border/30"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>1. Sealed In Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unlocked")}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-mono tracking-wider cursor-pointer transition-all ${
              activeTab === "unlocked"
                ? "bg-amber-400/20 text-accent font-bold border border-amber-400/40 shadow-xs"
                : "text-muted hover:text-text hover:bg-border/30"
            }`}
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>2. Revealed Horizon</span>
          </button>
        </div>
      </div>

      {/* Simulator Display Card */}
      <div className="saas-card rounded-3xl p-6 sm:p-10 shadow-2xl border border-border/80 relative overflow-hidden min-h-[460px] flex items-center justify-center">
        {activeTab === "sealed" ? (
          /* ================= SEALED SIMULATION VIEW ================= */
          <div className="w-full space-y-7 max-w-2xl mx-auto text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-md">
              <Lock className="h-8 w-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-mono text-accent-text mb-3">
                <Clock className="h-3 w-3" />
                <span>Locked Until October 24, 2030 (00:00 UTC)</span>
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-normal text-text">
                &ldquo;A Letter to My 30-Year-Old Self&rdquo;
              </h3>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto pt-2">
              {[
                { value: "1,460", label: "Days Left" },
                { value: "14", label: "Hours" },
                { value: "28", label: "Mins" },
                { value: "45", label: "Secs" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-border/20 text-center backdrop-blur-sm"
                >
                  <div className="font-mono text-xl sm:text-3xl font-light text-text">
                    {item.value}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Blurred Payload Teaser */}
            <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-border bg-border/10 text-center relative max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Message text AES-256-GCM Encrypted at Rest • Not transmitted before unlock</span>
              </div>
              <p className="text-xs sm:text-sm text-text/50 blur-[5px] select-none pointer-events-none line-clamp-2">
                If you are reading this in 2030, our startup dreams either came true or we learned unforgettable lessons...
              </p>
              <div className="absolute inset-0 flex items-center justify-center bg-card/30 backdrop-blur-[1px] rounded-2xl">
                <span className="font-mono text-xs text-accent-text bg-card/90 px-3 py-1.5 rounded-xl border border-border shadow-xs">
                  🔒 Message text AES-256-GCM encrypted payload excluded from queries
                </span>
              </div>
            </div>

            {/* Action to switch */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("unlocked")}
                className="saas-button-secondary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                <span>Simulate Unlock Day Arrival</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent" />
              </button>
            </div>
          </div>
        ) : (
          /* ================= UNLOCKED SIMULATION VIEW ================= */
          <div className="w-full space-y-6 max-w-2xl mx-auto text-left">
            {/* Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Unlocked on October 24, 2030 (00:00:02 UTC)</span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <span>Delivered to future.me@gmail.com</span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-normal text-text">
                &ldquo;A Letter to My 30-Year-Old Self&rdquo;
              </h3>
              <p className="text-xs font-mono text-muted mt-1">
                Written on October 24, 2024 • Traveled 6 Years Across Spacetime
              </p>
            </div>

            {/* The Unsealed Message Letter */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-text font-serif italic">
                &ldquo;Dear 30-year-old self,
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-text/90 font-light">
                If you are reading this, six long years have passed since you sat in a chilly room writing late at night. Right now, we have so many doubts and fears about whether we&apos;ll build the company we dreamed of, whether we&apos;ll make our family proud, and where we&apos;ll be living.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-text/90 font-light">
                Did you end up going to Kyoto? Did you keep playing guitar on Sunday mornings? Remember to breathe. Whatever happened, be proud of the fire we had in our chest today.&rdquo;
              </p>
              <div className="pt-2 text-right">
                <span className="font-display italic text-accent-text text-sm">
                  — Past Abhishek, Age 24
                </span>
              </div>
            </div>

            {/* Unlocked Photo Relics */}
            <div>
              <div className="text-xs font-mono text-muted mb-2.5 flex items-center justify-between">
                <span>Photographic Relics (Temporary 15-Minute Signed URLs)</span>
                <span className="text-accent-text flex items-center gap-1 text-[11px]">
                  <Eye className="h-3 w-3" /> 3 Images Retrieved
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { title: "First Workspace", date: "Oct 2024", color: "from-amber-600/30 to-amber-900/30" },
                  { title: "Late Night Code", date: "Nov 2024", color: "from-indigo-600/30 to-indigo-900/30" },
                  { title: "With Best Friends", date: "Dec 2024", color: "from-rose-600/30 to-rose-900/30" },
                ].map((relic, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-card/80 p-2.5 shadow-xs text-center group hover:border-amber-500/40 transition-all"
                  >
                    <div className={`h-16 sm:h-20 w-full rounded-lg bg-gradient-to-tr ${relic.color} border border-border/50 flex flex-col items-center justify-center text-text/80 mb-2`}>
                      <ImageIcon className="h-5 w-5 text-accent mb-1" />
                      <span className="text-[10px] font-mono text-muted">{relic.date}</span>
                    </div>
                    <div className="font-mono text-[11px] truncate text-text font-medium">
                      {relic.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reseal back button */}
            <div className="pt-2 text-center sm:text-right">
              <button
                type="button"
                onClick={() => setActiveTab("sealed")}
                className="saas-button-secondary inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-accent" />
                <span>Return to Sealed Vault View</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
