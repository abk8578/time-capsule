"use client";

import React from "react";
import { Target, Heart, Sparkles, TrendingUp, Quote } from "lucide-react";

export default function UseCasesSection() {
  const useCases = [
    {
      title: "Career & Life Milestones",
      badge: "5-Year Horizon",
      quote: "“Did we build the startup we brainstormed on napkins? Are you happy with the sacrifices we made?”",
      desc: "Record your audacious goals, current salary, and creative bets. Rediscover them half a decade later with the irreplaceable clarity of hindsight.",
      icon: Target,
      badgeStyle: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    },
    {
      title: "Letters to Your Children",
      badge: "18-Year Milestone",
      quote: "“Today you took your first wobbly steps across our living room. I am writing this so you know how fiercely you were loved from day one.”",
      desc: "Preserve photos and raw memories of childhood. Lock them away to awaken directly in your child&apos;s email on their 18th solar return.",
      icon: Heart,
      badgeStyle: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    },
    {
      title: "Predictions & Foresight",
      badge: "Decade Orbit",
      quote: "“Betting that by 2035, autonomous space probes will return samples from the ice geysers of Enceladus.”",
      desc: "Place your bets on technological revolutions, cultural shifts, and geopolitics. Test whether you were a visionary or wonderfully mistaken.",
      icon: TrendingUp,
      badgeStyle: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    },
    {
      title: "Healing & Self-Compassion",
      badge: "Anchor of Light",
      quote: "“You survived the storm. Look back at this difficult week and realize how resilient your spirit truly is.”",
      desc: "When life feels overwhelming, write a letter to the future version of you who has healed. A permanent anchor to your own inner resilience.",
      icon: Sparkles,
      badgeStyle: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="saas-badge mb-3">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Inspirations & Journeys</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
          What Will You Inscribe?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted font-light max-w-xl mx-auto leading-relaxed">
          Every human life is a profound story that only time can truly complete.
        </p>
      </div>

      {/* Grid of 4 Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {useCases.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="saas-card saas-card-interactive group rounded-3xl p-8 sm:p-9 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 shadow-xs">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${item.badgeStyle}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-display text-2xl font-semibold text-text mb-4">
                  {item.title}
                </h3>

                <div className="relative p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm mb-5 text-text/90">
                  <Quote className="h-4 w-4 text-accent/60 mb-2" />
                  <p className="text-xs sm:text-sm italic font-serif leading-relaxed">
                    {item.quote}
                  </p>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-muted font-light">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-mono text-muted flex items-center justify-between">
                <span>Template Available in Vault</span>
                <span className="text-accent-text font-medium group-hover:translate-x-1 transition-transform">Use Template →</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
