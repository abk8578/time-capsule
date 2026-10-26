"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUp,
  ShieldCheck,
  Send,
  Lock,
  Heart,
  CheckCircle2,
  Compass,
} from "lucide-react";

export default function Footer() {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setEmailInput("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 w-full border-t border-border bg-card/90 backdrop-blur-2xl transition-colors duration-200 overflow-hidden text-text">
      {/* Decorative Galaxy Starlight Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-border">
          {/* Column 1: Brand & Cosmic Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-text group"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-slate-950 shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-display text-2xl tracking-tight text-text">
                Time<span className="text-accent font-semibold">Capsule</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-muted max-w-sm font-light">
              Preserving your authentic memories, predictions, and emotional truths in cryptographic isolation across the cosmic expanse until time catches up.
            </p>

            {/* Deep Space Node Status Beacon */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-mono text-accent-text">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="truncate">Deep Space Node: Synchronized • UTC Clock Verified</span>
              </div>
            </div>
          </div>

          {/* Column 2: Stellar Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-accent">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-mono text-muted">
              <li>
                <Link
                  href="/capsules/new"
                  className="hover:text-text transition-colors duration-200 inline-block py-1"
                >
                  Ignite New Star
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-text transition-colors duration-200 inline-block py-1"
                >
                  Constellation Sky
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-text transition-colors duration-200 inline-block py-1"
                >
                  Enter Orbit
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-text transition-colors duration-200 inline-block py-1"
                >
                  Chart Constellation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Cosmic Inspirations */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-accent">
              Inspirations
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-mono text-muted">
              <li className="flex items-center gap-2">
                <Compass className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>5-Year Orbit Ambition</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>Vows Across Time</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>2030 World Predictions</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Personal Healing Beacon</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Cosmic Inscriptions Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-accent">
              Starlit Prompts
            </h4>
            <p className="text-xs text-muted leading-relaxed font-light">
              Receive thoughtful celestial writing prompts to inspire your next star.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-accent/30 bg-accent/10 text-xs font-mono text-accent-text">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span>Coordinates registered!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="future.you@cosmos.space"
                    className="w-full rounded-2xl border border-border bg-card py-2.5 pl-3.5 pr-10 text-xs font-mono text-text placeholder:text-muted outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to writing prompts"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-xs hover:brightness-110 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="block text-[10px] font-mono text-muted">
                  Zero spam. Silence guaranteed.
                </span>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Ascend to Zenith */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
            <span>
              &copy; {new Date().getFullYear()} Time Capsule. Forged for your future self.
            </span>
            <span className="hidden sm:inline text-muted/40">•</span>
            <span>AES-256-GCM Encrypted Timelock</span>
          </div>

          <button
            onClick={scrollToTop}
            type="button"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-text hover:border-accent transition cursor-pointer"
          >
            <span>Ascend to Zenith</span>
            <ArrowUp className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
      </div>
    </footer>
  );
}
