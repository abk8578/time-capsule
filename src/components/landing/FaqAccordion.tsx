"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can I unlock my time capsule before the scheduled date?",
      a: "No. The system is designed with strict cryptographic tamper-proofing. Database queries strictly omit your message text until the server's UTC atomic clock passes your designated unlock moment.",
      tag: "Security",
    },
    {
      q: "What happens when my capsule reaches its unlock date?",
      a: "Our automated background cron scheduler detects the unlocked timestamp down to the second and immediately dispatches an email notification via Resend with a secure direct link to view your memories.",
      tag: "Delivery",
    },
    {
      q: "Are my uploaded photos and memories kept private?",
      a: "Yes. Photographs and voice notes are uploaded directly to a private Supabase object storage bucket that denies all public read access. When you unlock a capsule, the server generates short-lived signed read URLs valid for just 15 minutes.",
      tag: "Storage",
    },
    {
      q: "Can administrators or anyone else read my sealed letters?",
      a: "No. Capsules are tied exclusively to your authenticated user ID. Any request made for someone else's capsule immediately returns a 404 (Not Found) rather than exposing metadata.",
      tag: "Privacy",
    },
    {
      q: "How far into the future can I set an unlock date?",
      a: "You can choose any future date—from tomorrow morning to several decades into the future. Your memories will be quietly waiting in cryptographic isolation until time catches up.",
      tag: "Longevity",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="saas-badge mb-3">
          <HelpCircle className="h-3.5 w-3.5 text-accent" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-text">
          Everything You Need to Know
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted font-light max-w-lg mx-auto">
          Clear answers about how we protect your letters, photos, and future delivery.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3.5">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`saas-card rounded-2xl overflow-hidden transition-all duration-200 ${
                isOpen ? "border-amber-500/40 shadow-md" : "border-border/80 hover:border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 pr-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent-text bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    {faq.tag}
                  </span>
                  <span className="font-display text-base sm:text-lg font-medium text-text">
                    {faq.q}
                  </span>
                </div>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border/20 border border-border text-accent transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-amber-500/15 border-amber-500/30" : ""
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 pt-1 text-xs sm:text-sm text-muted font-light leading-relaxed border-t border-border/50">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
