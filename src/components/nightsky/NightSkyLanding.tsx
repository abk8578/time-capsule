"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Compass, ShieldCheck, Clock } from "lucide-react";
import MagneticButton from "@/components/motion/MagneticButton";

// Lazy load 3D Night Sky Canvas (ssr: false)
const NightSkyCanvas = dynamic(() => import("./NightSkyCanvas"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#03060E] -z-10" />,
});

export default function NightSkyLanding() {
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [scrollNorm, setScrollNorm] = useState(0);

  // Global scroll tracking for 3D camera flight and cinematic title sequence
  const { scrollYProgress } = useScroll();

  // Scroll animations for Act 1: Hero title scaling and fading past like a movie title sequence
  const titleScale = useTransform(scrollYProgress, [0, 0.28], [1, 2.2]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.28], [0, -140]);

  // Act 2: Constellation philosophy
  const act2Opacity = useTransform(scrollYProgress, [0.18, 0.35, 0.55], [0, 1, 0]);
  const act2Y = useTransform(scrollYProgress, [0.18, 0.35, 0.55], [60, 0, -60]);

  // Act 3: Final destination CTA star
  const act3Opacity = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
  const act3Scale = useTransform(scrollYProgress, [0.65, 0.9], [0.85, 1]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setScrollNorm(v);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Mouse move handler for camera parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setPointerPos({ x, y });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative w-full min-h-[340vh] text-white selection:bg-amber-400/30 selection:text-amber-200"
    >
      {/* 3D Night Sky Canvas: Clean starfield, shatterable stars and planet */}
      <NightSkyCanvas scrollProgress={scrollNorm} pointerPos={pointerPos} />

      {/* ========================================================
          ACT 1: CINEMATIC TITLE SEQUENCE (0 - 100vh)
          ======================================================== */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between items-center px-4 sm:px-8 py-10 pointer-events-none z-10">
        {/* Top Eyebrow Tag */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="pt-8 flex flex-col items-center gap-2 pointer-events-auto"
        >
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-amber-400 drop-shadow-md">
            The Cosmic Vault
          </span>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
          <span className="text-[10px] font-mono tracking-widest text-amber-300/90 mt-0.5">
            ⚡ Touch the central planet for Thor&apos;s lightning · Touch side stars to shatter · Scroll to destroy
          </span>
        </motion.div>

        {/* HUGE Fraunces Title (9-12vw) scaling and fading past */}
        <motion.div
          style={{
            scale: titleScale,
            opacity: titleOpacity,
            y: titleY,
          }}
          className="text-center max-w-6xl mx-auto my-auto select-none"
        >
          <h1 className="font-display text-[10vw] sm:text-[11vw] md:text-[12vw] font-extrabold tracking-tighter leading-[0.88] text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.2)]">
            EVERY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]">
              CAPSULE
            </span> <br />
            IS A STAR
          </h1>

          <p className="mt-6 text-sm sm:text-lg font-light tracking-wide text-slate-300 max-w-lg mx-auto leading-relaxed">
            Letters written to your future self, suspended in deep orbit until the exact moment time catches up.
          </p>
        </motion.div>

        {/* Scroll Instruction */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="pb-6 flex flex-col items-center gap-2.5 text-slate-400"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            Scroll to fly through time
          </span>
          <div className="w-5 h-8 rounded-full border border-slate-500 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
            />
          </div>
        </motion.div>
      </div>

      {/* ========================================================
          ACT 2: PHILOSOPHY OF THE CELESTIAL VAULT (120vh - 220vh)
          ======================================================== */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-8 pointer-events-auto z-20 my-24">
        <motion.div
          style={{ opacity: act2Opacity, y: act2Y }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.4em] text-amber-400 font-semibold">
              The Architecture of Waiting
            </span>
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.05]">
              Locked in silence. <br />
              <span className="text-slate-400 font-normal">Guaranteed by the cosmos.</span>
            </h2>
          </div>

          <p className="text-base sm:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto">
            Traditional apps show you empty boxes. Here, your thoughts become coordinates in the night sky. Not even database administrators can inspect your words before your chosen unlock date arrives.
          </p>

          {/* 3 Starlit Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            <div className="galaxy-card flex flex-col items-center text-center space-y-3 p-8 rounded-3xl shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-md star-glow-amber">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Message Text AES-256-GCM</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Message text AES-256-GCM encrypted at rest, aur unlock se pehle content server se bheja hi nahi jata.
              </p>
            </div>

            <div className="galaxy-card flex flex-col items-center text-center space-y-3 p-8 rounded-3xl shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-md star-glow-amber">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">UTC Atomic Time</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Client clocks are discarded. Verified server time governs every unsealing.
              </p>
            </div>

            <div className="galaxy-card flex flex-col items-center text-center space-y-3 p-8 rounded-3xl shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-md star-glow-amber">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Ephemeral Starlight</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Photos and voice notes sleep in private storage, awakening with 15-minute signed links.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================
          ACT 3: THE CALL-TO-ACTION STAR (240vh - 340vh)
          ======================================================== */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-8 pointer-events-auto z-20 pb-28">
        <motion.div
          style={{ opacity: act3Opacity, scale: act3Scale }}
          className="max-w-2xl mx-auto text-center space-y-8"
        >
          {/* Radiant Destination Star Artifact */}
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl animate-ping" />
            <div className="absolute inset-2 rounded-full bg-amber-400/30 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-white shadow-[0_0_50px_#F59E0B,0_0_100px_#FBBF24] flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-amber-900" />
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-amber-400 font-mono">
              Your Coordinates Await
            </span>
            <h2 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-white leading-tight">
              Ignite Your First Star
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-light max-w-md mx-auto leading-relaxed">
              Step into the quiet dark. Write the letter your future self needs to read.
            </p>
          </div>

          {/* Magnetic Star Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <MagneticButton strength={28}>
              <Link
                href="/signup"
                className="galaxy-button group relative flex min-h-[56px] items-center justify-center gap-3 rounded-full px-10 text-xs font-mono uppercase tracking-wider text-slate-950 font-bold shadow-2xl cursor-pointer"
              >
                <span>Seal A Capsule Into The Cosmos</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
              </Link>
            </MagneticButton>

            <Link
              href="/login"
              className="flex min-h-[56px] items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-8 text-xs font-mono uppercase tracking-wider text-white hover:bg-white/10 hover:border-amber-400/50 transition-colors"
            >
              Enter Existing Vault
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
