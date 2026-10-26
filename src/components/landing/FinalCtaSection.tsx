"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
      <div className="saas-card rounded-3xl p-10 sm:p-16 shadow-2xl border border-border/80 relative overflow-hidden">
        {/* Ambient Radiant Mesh Background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-indigo-500/10" />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/15 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="saas-badge">
            <Sparkles className="h-3 w-3 text-accent" />
            <span>Begin Your Journey Today</span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-text leading-[1.08]">
            Your Future Self Is Waiting.
          </h2>

          <p className="text-base sm:text-lg text-muted font-light leading-relaxed max-w-xl mx-auto">
            Take five quiet minutes tonight to preserve this chapter of your life. When your chosen date arrives, your words will awaken like an unexpected gift across time.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              id="cta-create-capsule"
              href="/signup"
              className="saas-button-primary flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-3 rounded-xl px-9 text-sm font-semibold shadow-lg cursor-pointer"
            >
              <span>Seal Your First Capsule</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="saas-button-secondary inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 text-xs font-mono uppercase tracking-wider cursor-pointer"
            >
              <ArrowUp className="h-4 w-4 text-accent" />
              <span>Back to Top</span>
            </button>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>100% Free Forever</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              <span>End-to-End Cryptographic Seal</span>
            </div>
            <span>•</span>
            <div>No Credit Card Needed</div>
          </div>
        </div>
      </div>
    </section>
  );
}
