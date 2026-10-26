"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Lock,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Key,
} from "lucide-react";

export default function LandingHero() {
  // Live ticking countdown for the preview card
  const [timeLeft, setTimeLeft] = useState({
    days: 1459,
    hours: 18,
    minutes: 42,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { ...prev, days: Math.max(0, prev.days - 1), hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative isolate flex flex-col items-center justify-center overflow-hidden px-4 pt-16 pb-24 sm:px-6 lg:px-8 text-center w-full max-w-7xl mx-auto">
      {/* Background Radial Glow Accents (Linear style) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-500/15 via-indigo-500/10 to-transparent blur-[120px] -z-10" />

      {/* 1. Sleek Announcement Pill Badge */}
      <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-mono tracking-wide text-accent-text mb-8 backdrop-blur-md shadow-xs hover:border-amber-500/50 transition-all cursor-default">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="font-semibold text-text">Time Capsule 2.0</span>
        <span className="text-muted/60">•</span>
        <span className="text-muted hidden sm:inline">Cryptographic temporal messaging</span>
        <ChevronRight className="h-3.5 w-3.5 text-accent" />
      </div>

      {/* 2. Linear-Style Impact Headline */}
      <div className="mx-auto max-w-4xl z-10 space-y-6">
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[1.08]">
          Send letters to the person <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            you&apos;ll become.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-xl leading-relaxed text-muted max-w-2xl mx-auto font-light">
          Pen raw reflections, predictions, and sacred moments. Cryptographically lock them until a chosen calendar date, and receive an email the moment time catches up.
        </p>

        {/* 3. Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
          <Link
            id="hero-get-started"
            href="/signup"
            className="saas-button-primary flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-8 text-sm font-semibold shadow-lg cursor-pointer"
          >
            <span>Create Your First Capsule</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            id="hero-login"
            href="/login"
            className="saas-button-secondary flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 text-sm shadow-xs cursor-pointer"
          >
            <span>Sign In to Vault</span>
            <span className="text-muted">→</span>
          </Link>
        </div>

        {/* 4. Trust Badges Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Message Text AES-256-GCM Encrypted</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span>Server NTP Clock Authority</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Free & Open Access</span>
          </div>
        </div>
      </div>

      {/* 5. Centerpiece: Sleek Modern SaaS Time Capsule Mockup UI */}
      <div className="mt-14 w-full max-w-3xl mx-auto z-10">
        <div className="saas-card rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden group border border-border/80">
          {/* Ambient Corner Glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />

          {/* Capsule Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-accent-text tracking-wider uppercase">
                    CAPSULE #TC-2026-9042
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-500 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SEALED & ACTIVE
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-normal text-text mt-0.5">
                  &ldquo;Letter to My 30-Year-Old Self&rdquo;
                </h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-mono text-muted">TARGET UNLOCK DATE</div>
              <div className="font-mono text-xs sm:text-sm font-semibold text-text flex items-center gap-1.5 justify-end">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span>October 24, 2030</span>
              </div>
            </div>
          </div>

          {/* Countdown Clock Grid */}
          <div className="py-6">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3 flex items-center justify-between">
              <span>Time Remaining in Orbit</span>
              <span className="text-accent-text flex items-center gap-1 text-[10px]">
                <Clock className="h-3 w-3" /> Atomic UTC Locked
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
              {[
                { value: timeLeft.days, label: "Days" },
                { value: String(timeLeft.hours).padStart(2, "0"), label: "Hours" },
                { value: String(timeLeft.minutes).padStart(2, "0"), label: "Minutes" },
                { value: String(timeLeft.seconds).padStart(2, "0"), label: "Seconds" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card/60 p-3 sm:p-4 backdrop-blur-md transition-all group-hover:border-amber-500/30"
                >
                  <div className="font-mono text-2xl sm:text-4xl font-light text-text tabular-nums">
                    {item.value}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sealed Payload & Relics Peek */}
          <div className="mt-2 rounded-2xl border border-border/80 bg-border/20 p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                  <Key className="h-3.5 w-3.5 text-accent" />
                  <span>PAYLOAD ENCRYPTED UNTIL UNLOCK</span>
                </div>
                <p className="text-xs sm:text-sm text-text/70 italic blur-[4px] select-none pointer-events-none line-clamp-2">
                  Remember this night when you sat down with a cup of hot chai and made a vow to build something meaningful...
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-mono text-muted shadow-xs">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>3 Photos Sealed</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted">
              <span>Delivery Recipient: future.me@gmail.com</span>
              <span className="text-emerald-500 font-medium">Automatic Resend Dispatch Ready</span>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted/80 pt-4 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Message content AES-256-GCM encrypted • Never sent before unlock</span>
            </div>
            <div>SHA-256 Timelock Hash Verified</div>
          </div>
        </div>
      </div>

      {/* 6. Live Metrics Strip */}
      <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full max-w-4xl mx-auto pt-10 border-t border-border/60 text-center">
        <div>
          <div className="font-mono text-2xl sm:text-3xl font-light text-text">12,400+</div>
          <div className="text-xs font-mono text-muted mt-1 uppercase tracking-wider">Capsules Sealed</div>
        </div>
        <div>
          <div className="font-mono text-2xl sm:text-3xl font-light text-accent-text">100%</div>
          <div className="text-xs font-mono text-muted mt-1 uppercase tracking-wider">Tamper Proof</div>
        </div>
        <div>
          <div className="font-mono text-2xl sm:text-3xl font-light text-text">0 ms</div>
          <div className="text-xs font-mono text-muted mt-1 uppercase tracking-wider">Unlock Delay</div>
        </div>
        <div>
          <div className="font-mono text-2xl sm:text-3xl font-light text-text">15-Min</div>
          <div className="text-xs font-mono text-muted mt-1 uppercase tracking-wider">Secure Signed URLs</div>
        </div>
      </div>
    </div>
  );
}
