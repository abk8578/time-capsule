"use client";

import React from "react";
import { PenTool, Calendar, BellRing, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Write & Attach Memories",
      desc: "Pen raw reflections, unvarnished thoughts, predictions, and milestones. Attach up to 5 photos and a voice note stored in private storage.",
      icon: PenTool,
      badge: "Step 1 • Inscribe",
    },
    {
      step: "02",
      title: "Select Your Unlock Date",
      desc: "Pick any date from 1 month to 20 years into the future. The server locks the coordinates into an atomic UTC timelock.",
      icon: Calendar,
      badge: "Step 2 • Chart Horizon",
    },
    {
      step: "03",
      title: "Receive When Time Arrives",
      desc: "AES-256-GCM encryption guards your message text at rest. Content is never sent from the server before your unlock date.",
      icon: BellRing,
      badge: "Step 3 • Awaken",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="saas-badge mb-3">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Simple 3-Step Protocol</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
          How Time Capsule Works
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted font-light max-w-xl mx-auto leading-relaxed">
          A seamless, sacred ritual bridging who you are today with the person you will become across spacetime.
        </p>
      </div>

      {/* 3 Step Connected Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="saas-card saas-card-interactive group relative rounded-3xl p-8 sm:p-9 flex flex-col justify-between"
            >
              {/* Step Number Top Badge */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-xs group-hover:scale-105 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-mono text-3xl font-light text-muted/30 group-hover:text-accent-text transition-colors">
                  {item.step}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-accent-text font-medium">
                  {item.badge}
                </span>
                <h3 className="font-display text-2xl font-semibold text-text">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted font-light">
                  {item.desc}
                </p>
              </div>

              {/* Bottom Subtle Link */}
              <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted group-hover:text-text transition-colors">
                <span>Phase {item.step} Protocol</span>
                <ChevronRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Callout below */}
      <div className="mt-12 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-accent-text transition-colors"
        >
          <span>Ready to inscribe your first letter?</span>
          <span className="text-accent underline font-semibold">Start writing in 60 seconds →</span>
        </Link>
      </div>
    </section>
  );
}
