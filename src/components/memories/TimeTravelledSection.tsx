"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, useScroll } from "motion/react";
import { Hourglass, Lock, Unlock } from "lucide-react";

interface TimeTravelledSectionProps {
  createdAtIso: string;
  openedAtIso: string;
  createdAtFormatted: string;
  openedAtFormatted: string;
}

export default function TimeTravelledSection({
  createdAtIso,
  openedAtIso,
  createdAtFormatted,
  openedAtFormatted,
}: TimeTravelledSectionProps) {
  const sealedDate = new Date(createdAtIso);
  const openedDate = new Date(openedAtIso);
  const diffMs = Math.abs(openedDate.getTime() - sealedDate.getTime());
  const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  // 1. Counter state and InView detection
  const counterRef = useRef<HTMLDivElement | null>(null);
  const isCounterInView = useInView(counterRef, { once: true, margin: "-120px" });
  const [displayDays, setDisplayDays] = useState(0);

  useEffect(() => {
    if (!isCounterInView) return;

    let startTime: number | null = null;
    const duration = 2200; // 2.2s count up
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo for dramatic deceleration
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayDays(Math.round(ease * totalDays));

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [isCounterInView, totalDays]);

  // 2. Timeline scroll drawing progress
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 50%"],
  });

  return (
    <section className="relative py-24 px-4 sm:px-8 max-w-4xl mx-auto w-full">
      {/* Big Counter */}
      <div
        ref={counterRef}
        className="text-center mb-16 flex flex-col items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted mb-3"
        >
          <Hourglass className="h-4 w-4 text-accent-text" />
          <span>Time Travelled</span>
        </motion.div>

        <div className="font-display text-7xl sm:text-9xl font-extrabold text-accent tracking-tight leading-none drop-shadow-sm select-none">
          {displayDays.toLocaleString()}
        </div>

        <p className="mt-3 text-lg sm:text-2xl font-medium text-muted">
          {totalDays === 1 ? "day preserved in silence" : "days preserved across time"}
        </p>
      </div>

      {/* Interactive Horizontal SVG Timeline that draws itself as you scroll */}
      <div ref={timelineRef} className="relative pt-8 pb-12">
        <div className="relative w-full max-w-2xl mx-auto">
          {/* SVG Line Canvas */}
          <div className="relative h-12 flex items-center">
            <svg
              className="w-full h-8 overflow-visible"
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background baseline track */}
              <line
                x1="0"
                y1="4"
                x2="100"
                y2="4"
                stroke="currentColor"
                className="text-border/60 dark:text-border"
                strokeWidth="2"
                strokeDasharray="2 3"
              />

              {/* Animated drawing golden stroke */}
              <motion.line
                x1="0"
                y1="4"
                x2="100"
                y2="4"
                stroke="var(--accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{
                  pathLength: scrollYProgress,
                }}
              />
            </svg>

            {/* Left Milestone: Sealed Date */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-accent bg-card shadow-md z-10">
                <Lock className="h-3.5 w-3.5 text-accent-text" />
                <span className="absolute -inset-1 rounded-full bg-accent/20 animate-ping -z-10" />
              </div>
            </div>

            {/* Right Milestone: Opened Date */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-500 bg-card shadow-md z-10">
                <Unlock className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Milestone Labels */}
          <div className="mt-4 flex items-start justify-between text-xs sm:text-sm">
            {/* Sealed Date Info */}
            <div className="flex flex-col items-start max-w-[140px] sm:max-w-[200px]">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-muted">
                Sealed Date
              </span>
              <span className="font-semibold text-text mt-0.5">
                {createdAtFormatted}
              </span>
            </div>

            {/* Opened Date Info */}
            <div className="flex flex-col items-end max-w-[140px] sm:max-w-[200px] text-right">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                Opened Date
              </span>
              <span className="font-semibold text-text mt-0.5">
                {openedAtFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
