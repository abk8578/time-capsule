"use client";

import { useState, useEffect } from "react";
import { Sparkles, Mail, FastForward } from "lucide-react";

interface DigUpRevealerProps {
  capsuleId: string;
  children: React.ReactNode;
}

type AnimationStage = "checking" | "lid-lifting" | "letter-revealing" | "completed";

export default function DigUpRevealer({ capsuleId, children }: DigUpRevealerProps) {
  const [stage, setStage] = useState<AnimationStage>("checking");

  useEffect(() => {
    let lidTimer: NodeJS.Timeout;
    let finishTimer: NodeJS.Timeout;

    const initTimer = setTimeout(() => {
      // 1. Check prefers-reduced-motion
      let prefersReduced = false;
      try {
        prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        prefersReduced = false;
      }

      // 2. Check sessionStorage (once per capsule per browser session)
      let alreadySeen = false;
      const storageKey = `capsule_unsealed_${capsuleId}`;
      try {
        alreadySeen = !!sessionStorage.getItem(storageKey);
      } catch {
        alreadySeen = false;
      }

      // If reduced motion or already viewed, skip animation immediately
      if (prefersReduced || alreadySeen) {
        setStage("completed");
        return;
      }

      // Begin animation sequence (total duration: ~2 seconds)
      // Stage 1: The sealed box lifts its lid (0 - 800ms)
      setStage("lid-lifting");

      lidTimer = setTimeout(() => {
        // Stage 2: The letter fades in and rises (800ms - 2000ms)
        setStage("letter-revealing");
      }, 800);

      finishTimer = setTimeout(() => {
        // Stage 3: Animation complete, save to sessionStorage
        try {
          sessionStorage.setItem(storageKey, "true");
        } catch {
          // Handle sessionStorage failure or disabled gracefully
        }
        setStage("completed");
      }, 2100);
    }, 0);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(lidTimer);
      clearTimeout(finishTimer);
    };
  }, [capsuleId]);

  const handleSkip = () => {
    try {
      sessionStorage.setItem(`capsule_unsealed_${capsuleId}`, "true");
    } catch {
      // Graceful fallback
    }
    setStage("completed");
  };

  // If check is complete and animation is done, render the unlocked content directly
  if (stage === "completed") {
    return <div className="transition-opacity duration-500 opacity-100">{children}</div>;
  }

  // During initial check on SSR / initial hydration before mount
  if (stage === "checking") {
    return <div className="opacity-0">{children}</div>;
  }

  // Active animation view (~2 seconds)
  const isLidOpen = stage === "lid-lifting" || stage === "letter-revealing";
  const isLetterVisible = stage === "letter-revealing";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 w-full">
      <div
        aria-live="polite"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-8 sm:p-14 shadow-lg text-center overflow-hidden transition-all duration-300"
      >
      {/* Skip Button (Real accessible <button>) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          id="skip-digup-animation"
          onClick={handleSkip}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg/80 hover:bg-bg px-3 py-1.5 text-xs font-semibold text-muted hover:text-text hover:border-accent transition cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Skip unsealing animation"
        >
          <span>Skip</span>
          <FastForward className="h-3 w-3" />
        </button>
      </div>

      {/* Decorative Golden Glow from inside box */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/25 blur-3xl transition-opacity duration-700 ${
          isLidOpen ? "opacity-100 scale-125" : "opacity-0 scale-75"
        }`}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[320px]">
        {/* Animated Capsule Box Graphic */}
        <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
          {/* Floating Letter (Reveals in stage 2) */}
          <div
            className={`absolute z-10 transition-all duration-700 ease-out transform ${
              isLetterVisible
                ? "translate-y-[-32px] opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-75"
            }`}
          >
            <div className="relative flex items-center justify-center w-16 h-12 bg-amber-50 dark:bg-amber-950 border-2 border-accent rounded-lg shadow-xl shadow-accent/20">
              <Mail className="h-6 w-6 text-accent-text" />
              <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-accent flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-on-accent" />
              </div>
            </div>
          </div>

          {/* Time Capsule Box Lid (Lifts in stage 1) */}
          <div
            className={`absolute top-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 ease-out origin-top-left transform ${
              isLidOpen
                ? "-translate-y-8 -rotate-12 scale-105"
                : "translate-y-0 rotate-0 scale-100"
            }`}
          >
            <div className="w-24 h-6 rounded-t-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 border border-amber-300 dark:border-amber-600 shadow-md flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-amber-800/40" />
            </div>
          </div>

          {/* Time Capsule Box Base */}
          <div className="absolute top-11 left-1/2 -translate-x-1/2 z-0">
            <div className="w-24 h-16 rounded-b-2xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 border-2 border-amber-500/80 shadow-2xl flex flex-col items-center justify-center">
              {/* Lock emblem turning into glow */}
              <div className="w-6 h-6 rounded-full bg-amber-950/60 border border-amber-400/50 flex items-center justify-center">
                <Sparkles
                  className={`h-3 w-3 text-amber-300 transition-transform duration-700 ${
                    isLidOpen ? "rotate-45 scale-110" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic status caption */}
        <div className="space-y-1.5">
          <p className="font-display text-lg font-bold text-text tracking-tight animate-pulse">
            {stage === "lid-lifting"
              ? "Unsealing the capsule..."
              : "Unfolding your memories..."}
          </p>
          <p className="text-xs text-muted">
            Preserved through time, now returning to you.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
