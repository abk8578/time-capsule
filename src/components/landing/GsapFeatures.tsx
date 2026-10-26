"use client";

import React from "react";
import {
  Lock,
  Clock,
  Sparkles,
  Server,
  KeyRound,
  Mail,
  FileCode2,
} from "lucide-react";

export default function GsapFeatures() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="saas-badge mb-3">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Cryptographic Architecture</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
          Engineered for Absolute Secrecy
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted font-light max-w-xl mx-auto leading-relaxed">
          Architected so that even the creators of the system cannot inspect your words before time arrives.
        </p>
      </div>

      {/* Modern Linear-Style Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bento Item 1: Large Span 2 - AES-256-GCM Encryption & Query Isolation */}
        <div className="saas-card saas-card-interactive md:col-span-2 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-xs">
                <Lock className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                AES-256-GCM Sealed
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-text mb-3">
              Message Text AES-256-GCM Encryption
            </h3>
            <p className="text-sm text-muted leading-relaxed max-w-xl font-light">
              Message text is AES-256-GCM encrypted at rest, aur unlock se pehle content server se bheja hi nahi jata. Database query projection filters physically omit message content until the exact unlock second arrives.
            </p>
          </div>

          {/* Terminal / Code snippet visualization */}
          <div className="mt-6 rounded-2xl border border-border/80 bg-card/80 p-4 font-mono text-xs text-muted backdrop-blur-md">
            <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-border/60 text-[11px]">
              <FileCode2 className="h-3.5 w-3.5 text-accent" />
              <span className="text-text font-medium">server/controllers/capsule.ts</span>
              <span className="ml-auto text-[10px] text-emerald-500">PROJECTION FILTER ENFORCED</span>
            </div>
            <div className="space-y-1 text-slate-400 dark:text-slate-300">
              <p>
                <span className="text-amber-400">const</span> isUnlocked = Date.now() &gt;= capsule.unlockAt;
              </p>
              <p>
                <span className="text-indigo-400">if</span> (!isUnlocked) {"{"}
              </p>
              <p className="pl-4 text-emerald-400">
                <span className="text-muted/60">{"// Payload physically excluded from memory & response"}</span>
              </p>
              <p className="pl-4">
                <span className="text-amber-400">delete</span> capsule.message;
              </p>
              <p>{"}"}</p>
            </div>
          </div>
        </div>

        {/* Bento Item 2: Span 1 - Atomic UTC Server Clock */}
        <div className="saas-card saas-card-interactive rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-xs">
                <Clock className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-accent-text">
                NTP Sync
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-semibold text-text mb-3">
              Atomic UTC Clock Authority
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">
              Client system clocks are never trusted. Unlock eligibility is computed strictly against independent, synchronized atomic server clocks.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-2xl border border-border/80 bg-border/20 font-mono text-xs text-center space-y-1">
            <div className="text-[10px] text-muted uppercase tracking-wider">Independent Server Clock</div>
            <div className="text-base font-semibold text-text text-accent-text">NTP ±0.002ms DRIFT</div>
          </div>
        </div>

        {/* Bento Item 3: Span 1 - 15-Minute Ephemeral Relics */}
        <div className="saas-card saas-card-interactive rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-xs">
                <KeyRound className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-accent-text">
                Private Bucket
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-semibold text-text mb-3">
              15-Minute Signed URLs
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-light">
              Photographs and audio relics reside in private Supabase storage with zero public read access. When you unlock a capsule, short-lived signed URLs expire in 15 minutes.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-2xl border border-border/80 bg-border/20 font-mono text-xs text-center space-y-1">
            <div className="text-[10px] text-muted uppercase tracking-wider">Storage Access Token</div>
            <div className="text-base font-semibold text-emerald-500">AUTO-REVOKED @ 900s</div>
          </div>
        </div>

        {/* Bento Item 4: Large Span 2 - Automated Delivery Engine */}
        <div className="saas-card saas-card-interactive md:col-span-2 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-xs">
                <Mail className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Instant Notification
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-text mb-3">
              Automated Unlock Dispatch
            </h3>
            <p className="text-sm text-muted leading-relaxed max-w-xl font-light">
              Our automated background scheduler monitors every sealed capsule. The exact second your date arrives, Resend triggers a secure notification directly to your registered email with direct access.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-border/20 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-accent" />
              <span className="text-text font-medium">Cron Engine Status: Active</span>
            </div>
            <div className="text-muted">Latency &lt; 2 seconds from target timestamp</div>
          </div>
        </div>
      </div>
    </section>
  );
}
