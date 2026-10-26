"use client";

import React from "react";
import { ShieldCheck, Lock, EyeOff, Server, KeyRound, CheckCircle2 } from "lucide-react";

export default function SecurityBanner() {
  const points = [
    {
      title: "Message Text AES-256-GCM Encrypted",
      desc: "Message text AES-256-GCM encrypted at rest, aur unlock se pehle content server se bheja hi nahi jata. Attached audio and photo relics reside in private storage.",
      icon: EyeOff,
      metric: "0 bytes transmitted before unlock",
    },
    {
      title: "Ephemeral Pre-Signed Storage",
      desc: "Attached photographic and audio relics reside inside private Supabase buckets with zero public access. When opened, the system creates temporary 15-minute signed links.",
      icon: KeyRound,
      metric: "Tokens auto-expire in 900s",
    },
    {
      title: "Authoritative NTP Server Time",
      desc: "Your device&apos;s local clock is never trusted for unlocks. Independent NTP-synchronized atomic server clocks enforce unlock eligibility down to the exact second.",
      icon: Server,
      metric: "Tamper-proof server clock",
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="saas-card rounded-3xl p-8 sm:p-12 shadow-2xl border border-border/80 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-border/60">
            <div>
              <div className="saas-badge mb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                <span>AES-256-GCM & Strict Projection</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-text">
                Why Your Words Are Safe in the Vault
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full self-start sm:self-auto">
              <Lock className="h-3.5 w-3.5" />
              <span>Immutable Cryptographic Seal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {points.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 space-y-3 flex flex-col justify-between hover:border-amber-500/30 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text">
                      {p.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted font-light">
                      {p.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/40 text-[11px] font-mono text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{p.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
