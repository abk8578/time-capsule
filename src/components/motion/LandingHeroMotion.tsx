"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import StarfieldSmall from "./StarfieldSmall";

export default function LandingHeroMotion() {
  const lineVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.18,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    }),
  };

  return (
    <div className="relative isolate flex flex-col items-center justify-center overflow-hidden px-4 pt-12 pb-16 sm:px-6 lg:px-8 text-center">
      {/* Background Starfield Canvas: Max 35 particles, pauses offscreen / tab hidden */}
      <StarfieldSmall />

      {/* Decorative Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl opacity-25"
      >
        <div className="aspect-[1155/678] w-[40rem] bg-gradient-to-tr from-accent to-amber-600 rounded-full" />
      </div>

      {/* Floating Time Capsule / Lock Illustration (Gently Bobs) */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-8 relative flex items-center justify-center"
      >
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-accent/20 via-card to-accent/10 border-2 border-accent/40 shadow-xl flex items-center justify-center backdrop-blur-sm">
          {/* Custom SVG Capsule/Lock */}
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 text-accent-text"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Shackle */}
            <path
              d="M16 20V14C16 9.58172 19.5817 6 24 6C28.4183 6 32 9.58172 32 14V20"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Body */}
            <rect
              x="10"
              y="20"
              width="28"
              height="22"
              rx="6"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="3"
            />
            {/* Keyhole */}
            <circle cx="24" cy="29" r="2.5" fill="currentColor" />
            <path
              d="M24 31.5V36"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
          </span>
        </div>
      </motion.div>

      {/* Line-by-Line Reveal Hero Text */}
      <div className="mx-auto max-w-3xl">
        {/* Line 0: Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-accent-text shadow-sm mb-6"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Capture today. Rediscover tomorrow.</span>
        </motion.div>

        {/* Line 1: Main Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-text leading-[1.15]"
        >
          Write letters to your <br className="hidden sm:inline" />
          <span className="text-accent-text">future self</span>
        </motion.h1>

        {/* Line 2: Subtitle */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className="mt-6 text-base sm:text-lg leading-relaxed text-muted max-w-2xl mx-auto"
        >
          Pen thoughts, reflections, predictions, and milestones. Lock them securely until a chosen date in the future, and get an email the instant your capsule unlocks.
        </motion.p>

        {/* Line 3: Action Buttons */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto"
          >
            <Link
              id="hero-get-started"
              href="/signup"
              className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-7 text-sm font-semibold text-on-accent shadow-md transition hover:brightness-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Create Your First Capsule</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto"
          >
            <Link
              id="hero-login"
              href="/login"
              className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-text shadow-xs transition hover:bg-border/30 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Sign In to Dashboard</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
