"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ChevronDown, Clock, Sparkles } from "lucide-react";
import StarfieldCanvas from "./StarfieldCanvas";

interface HeroSectionProps {
  title: string;
  createdAtFormatted: string;
  openedAtFormatted: string;
  isOpenedToday?: boolean;
}

export default function HeroSection({
  title,
  createdAtFormatted,
  openedAtFormatted,
  isOpenedToday = true,
}: HeroSectionProps) {
  // Staggered letter-by-letter animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 28,
      filter: "blur(6px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between overflow-hidden px-4 sm:px-8 py-8">
      {/* Background dust particles */}
      <StarfieldCanvas />

      {/* Top Header / Back Link */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-text transition-colors rounded-full border border-border bg-card/60 backdrop-blur-md px-3.5 py-1.5 shadow-sm hover:border-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-accent-text" />
          <span>Capsule Unlocked</span>
        </div>
      </div>

      {/* Center Hero: Title & Sealed Info */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-widest uppercase text-accent-text mb-6"
        >
          <Clock className="h-4 w-4 text-accent-text" />
          <span>A message from your past</span>
        </motion.div>

        {/* Fraunces Display Font Letter-by-Letter Reveal */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text leading-[1.1] mb-8"
        >
          {title.split(" ").map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em]">
              {Array.from(word).map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  variants={letterVariants}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h1>

        {/* Text: Sealed on {date}, opened today */}
        <motion.div
          variants={subtitleVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-2 text-base sm:text-xl font-medium text-muted"
        >
          <span>
            Sealed on <strong className="text-text font-semibold">{createdAtFormatted}</strong>,
          </span>
          <span>
            {isOpenedToday ? (
              <>opened <strong className="text-accent-text font-semibold">today</strong></>
            ) : (
              <>opened on <strong className="text-accent-text font-semibold">{openedAtFormatted}</strong></>
            )}
          </span>
        </motion.div>
      </div>

      {/* Bottom: Bobbing Scroll Hint */}
      <div className="relative z-10 flex flex-col items-center justify-center pb-4">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center gap-2 text-muted hover:text-text transition-colors cursor-pointer select-none"
          onClick={() => {
            window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
          }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Scroll to uncover
          </span>
          <div className="w-8 h-8 rounded-full border border-border bg-card/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <ChevronDown className="h-4 w-4 text-accent-text" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
