"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ThemeIntensity } from "@/types";
import { playJingleChime } from "@/lib/seasonal-audio";

interface Snowflake3D {
  id: number;
  left: number; // percentage 0 - 100
  size: number; // px size
  duration: number; // seconds
  opacity: number;
  driftX: number;
  driftEndX: number;
  depthLayer: "foreground" | "midground" | "background";
}

interface SleighFlight3D {
  id: number;
  duration: number;
}

interface DroppedGift {
  id: number;
  status: "falling" | "landed" | "opened";
}

interface ChristmasEffectsProps {
  intensity?: ThemeIntensity;
  isContained?: boolean;
}

const CHRISTMAS_GREETINGS = [
  "Ho Ho Ho! 🎅",
  "Santa is flying! 🦌✨",
  "Merry Christmas! 🎄",
  "Magic in the air! 🌟",
  "Holiday cheer unlocked! 🎁",
  "Peace & Joy across time! ✨",
];

export default function ChristmasEffects({
  intensity = 2,
  isContained = false,
}: ChristmasEffectsProps) {
  const [snowflakes, setSnowflakes] = useState<Snowflake3D[]>([]);
  const [sleigh, setSleigh] = useState<SleighFlight3D | null>(null);
  const [droppedGift, setDroppedGift] = useState<DroppedGift | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const nextSnowId = useRef(1);
  const nextSleighId = useRef(1);
  const nextGiftId = useRef(1);
  const isFlyingRef = useRef(false);
  const greetingTimeout = useRef<NodeJS.Timeout | null>(null);
  const sleighSafetyTimeout = useRef<NodeJS.Timeout | null>(null);
  const giftDropTimer = useRef<NodeJS.Timeout | null>(null);
  const giftLandTimer = useRef<NodeJS.Timeout | null>(null);
  const giftAutoCleanupTimer = useRef<NodeJS.Timeout | null>(null);

  // Scaled by intensity
  const maxSnow = intensity === 1 ? 16 : intensity === 2 ? 32 : 52;
  const snowIntervalMs = intensity === 1 ? 520 : intensity === 2 ? 300 : 170;

  // Statically generated background star coordinates for celestial twinkling
  const ambientStars = useMemo(() => {
    const stars = [];
    const count = intensity === 1 ? 16 : intensity === 2 ? 26 : 38;
    for (let i = 0; i < count; i++) {
      stars.push({
        id: i,
        top: Math.round(((i * 37) % 85) + 5),
        left: Math.round(((i * 53) % 92) + 4),
        size: (i % 3) + 2,
        delay: ((i * 0.4) % 3).toFixed(1),
      });
    }
    return stars;
  }, [intensity]);

  const removeSnowflake = useCallback((id: number) => {
    setSnowflakes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const removeSleigh = useCallback(() => {
    isFlyingRef.current = false;
    setIsFlying(false);
    setSleigh(null);
  }, []);

  // Handle Snow Globe Click / Touch: Sends Santa Flying Across the Sky!
  const handleGlobeClick = () => {
    // Prevent double-clicking / overlapping runs while Santa is currently flying
    if (isFlyingRef.current || sleigh !== null) {
      return;
    }

    isFlyingRef.current = true;
    setIsFlying(true);
    setIsShaking(true);
    setBurstCount((prev) => prev + 1);

    // Pick random festive greeting
    const randomQuote =
      CHRISTMAS_GREETINGS[Math.floor(Math.random() * CHRISTMAS_GREETINGS.length)];
    setGreeting(randomQuote);

    // Play sweet festive jingle chime
    playJingleChime();

    // Launch Santa in flight across the sky!
    const flightDuration = 6.8;
    setSleigh({
      id: nextSleighId.current++,
      duration: flightDuration,
    });

    // Schedule Gift Drop when Santa reaches screen center apex (~2.9s into flight)
    if (giftDropTimer.current) clearTimeout(giftDropTimer.current);
    giftDropTimer.current = setTimeout(() => {
      setDroppedGift({
        id: nextGiftId.current++,
        status: "falling",
      });
    }, 2900);

    // Schedule Gift Touchdown / Landing bounce at ~5.1s
    if (giftLandTimer.current) clearTimeout(giftLandTimer.current);
    giftLandTimer.current = setTimeout(() => {
      setDroppedGift((prev) => (prev ? { ...prev, status: "landed" } : null));
      playJingleChime();
    }, 5100);

    // Auto-dismiss landed gift gracefully after 14 seconds
    if (giftAutoCleanupTimer.current) clearTimeout(giftAutoCleanupTimer.current);
    giftAutoCleanupTimer.current = setTimeout(() => {
      setDroppedGift(null);
    }, 14000);

    // Spawn an instant flurry of fresh snowflakes around the globe
    const flurry: Snowflake3D[] = [];
    for (let i = 0; i < 8; i++) {
      flurry.push({
        id: nextSnowId.current++,
        left: Math.random() * 100,
        size: 16 + Math.random() * 8,
        duration: 3.5 + Math.random() * 2,
        opacity: 0.95,
        driftX: (Math.random() - 0.5) * 60,
        driftEndX: (Math.random() - 0.5) * 80,
        depthLayer: "foreground",
      });
    }
    setSnowflakes((prev) => [...prev, ...flurry]);

    // Safety timeout ensuring lock is released even if animationEnd is suppressed
    if (sleighSafetyTimeout.current) clearTimeout(sleighSafetyTimeout.current);
    sleighSafetyTimeout.current = setTimeout(() => {
      removeSleigh();
    }, Math.round(flightDuration * 1000 + 300));

    if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
    greetingTimeout.current = setTimeout(() => {
      setGreeting(null);
    }, 2800);

    setTimeout(() => {
      setIsShaking(false);
    }, 750);
  };

  // Handle tap / click on the dropped gift
  const handleGiftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!droppedGift || droppedGift.status !== "landed") return;
    setDroppedGift({ ...droppedGift, status: "opened" });
    playJingleChime();
    setTimeout(() => {
      setDroppedGift(null);
    }, 3800);
  };

  // 3D Parallax Tilt on Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 22;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -22;
    setMouseTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        return;
      }
    }

    const spawnSnowflake = () => {
      setSnowflakes((prev) => {
        if (prev.length >= maxSnow) {
          return prev;
        }
        const depthRandom = Math.random();
        const depthLayer: Snowflake3D["depthLayer"] =
          depthRandom > 0.75 ? "foreground" : depthRandom > 0.35 ? "midground" : "background";

        const size =
          depthLayer === "foreground"
            ? 18 + Math.random() * 8
            : depthLayer === "midground"
            ? 11 + Math.random() * 6
            : 6 + Math.random() * 4;

        const duration =
          depthLayer === "foreground"
            ? 4.2 + Math.random() * 2.5
            : depthLayer === "midground"
            ? 6.0 + Math.random() * 3.5
            : 8.5 + Math.random() * 4.0;

        const newSnow: Snowflake3D = {
          id: nextSnowId.current++,
          left: Math.random() * 100,
          size,
          duration,
          opacity: depthLayer === "foreground" ? 0.9 : depthLayer === "midground" ? 0.75 : 0.5,
          driftX: (Math.random() - 0.5) * 60,
          driftEndX: (Math.random() - 0.5) * 80,
          depthLayer,
        };
        return [...prev, newSnow];
      });
    };

    const snowTimer = setInterval(spawnSnowflake, snowIntervalMs);

    return () => {
      clearInterval(snowTimer);
      if (sleighSafetyTimeout.current) clearTimeout(sleighSafetyTimeout.current);
      if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
      if (giftDropTimer.current) clearTimeout(giftDropTimer.current);
      if (giftLandTimer.current) clearTimeout(giftLandTimer.current);
      if (giftAutoCleanupTimer.current) clearTimeout(giftAutoCleanupTimer.current);
      isFlyingRef.current = false;
      setSnowflakes([]);
      setSleigh(null);
      setDroppedGift(null);
    };
  }, [maxSnow, snowIntervalMs]);

  return (
    <div
      className={`pointer-events-none ${isContained ? "absolute" : "fixed"} inset-0 z-40 overflow-hidden`}
      style={{ perspective: "1200px" }}
      aria-hidden="true"
    >
      {/* 1. Ambient Celestial Twinkling Stars */}
      {ambientStars.map((star) => (
        <div
          key={star.id}
          className="star-twinkling absolute rounded-full bg-amber-200"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            boxShadow: "0 0 6px rgba(251, 191, 36, 0.7)",
          }}
        />
      ))}

      {/* 2. Interactive 3D Crystal Snow Globe in Bottom Right */}
      <div
        className={`group absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-30 select-none pointer-events-auto ${
          isFlying ? "cursor-default" : "cursor-pointer"
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleGlobeClick}
        title={isFlying ? "Santa in flight... 🎅" : "Tap me to send Santa flying! 🎄"}
      >
        {/* Floating Holiday Speech Bubble when Clicked */}
        {greeting ? (
          <div className="speech-bubble-pop absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-lg border border-emerald-300 z-40 pointer-events-none">
            {greeting}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-teal-600 rotate-45 border-r border-b border-emerald-300" />
          </div>
        ) : isFlying ? (
          /* Active Flight Status Indicator */
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-950/90 dark:bg-black/90 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-emerald-300 border border-emerald-500/40 shadow-sm flex items-center gap-1 pointer-events-none animate-pulse">
            <span>🎅</span>
            <span>Santa in flight...</span>
          </div>
        ) : (
          /* Prompt Pill on Hover */
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card/90 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-muted border border-border/80 shadow-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span>🎄</span>
            <span>Tap for Santa!</span>
          </div>
        )}

        {/* 3D Snow Globe Container with Mouse Parallax & Shake Animation */}
        <div
          className={`globe-3d relative w-28 h-32 sm:w-36 sm:h-40 flex flex-col items-center justify-end cursor-pointer transition-transform duration-150 ${
            isShaking ? "globe-shaking" : ""
          }`}
          style={{
            transform: isShaking
              ? undefined
              : `rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x}deg) scale(1)`,
          }}
        >
          {/* Ground Soft Glow & Volumetric Shadow */}
          <div className="absolute -bottom-2 w-28 sm:w-36 h-6 rounded-full bg-emerald-500/20 dark:bg-emerald-400/15 blur-lg pointer-events-none" />
          <div className="absolute bottom-0 w-22 sm:w-28 h-4 rounded-full bg-black/40 blur-xs pointer-events-none" />

          {/* Ornate Mahogany & Polished Brass Pedestal Base */}
          <div className="relative z-10 w-20 sm:w-24 h-6 sm:h-7 rounded-lg bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 shadow-xl border-t-2 border-amber-400/70 flex flex-col items-center justify-between p-0.5">
            <div className="w-14 sm:w-18 h-1 rounded-full bg-amber-300/40 border border-amber-300/30" />
            <div className="w-16 sm:w-20 h-2 rounded-xs bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 shadow-inner flex items-center justify-center">
              <span className="text-[7px] font-mono tracking-widest text-amber-950 uppercase font-black">2026</span>
            </div>
            <div className="w-18 sm:w-22 h-1 rounded-full bg-black/60" />
          </div>

          {/* 3D Glass Sphere with Volumetric Glass Shading & Pine Tree Inside */}
          <div className="relative -mb-1.5 w-26 h-26 sm:w-32 sm:h-32 rounded-full border border-white/50 bg-gradient-to-tr from-emerald-950/50 via-cyan-950/20 to-white/30 backdrop-blur-[2px] shadow-[0_0_35px_rgba(52,211,153,0.45),inset_0_0_20px_rgba(255,255,255,0.25)] overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200">
            {/* Top Glass Specular Arc Reflection */}
            <div className="absolute top-2.5 left-3.5 w-10 sm:w-12 h-5 rounded-full bg-gradient-to-b from-white/80 to-transparent blur-[0.6px] -rotate-45 pointer-events-none" />
            {/* Bottom Glass Glow */}
            <div className="absolute bottom-1 right-2 w-8 h-3 rounded-full bg-white/25 blur-[1px] rotate-12 pointer-events-none" />

            {/* Snowbank on Glass Floor */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-white/95 via-sky-100/90 to-transparent rounded-b-full pointer-events-none flex items-center justify-center">
              <div className="w-16 h-2 bg-white rounded-full blur-[0.5px]" />
            </div>

            {/* 3D Miniature Spinning Tree */}
            <div
              className={`relative z-10 w-14 h-16 sm:w-16 sm:h-20 -mb-2 flex flex-col items-center justify-center ${
                isShaking ? "animate-spin" : "inner-tree-spin"
              }`}
            >
              {/* Golden Tree Topper Star */}
              <div className="star-twinkling -mb-1 z-20">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-300 fill-current drop-shadow-[0_0_8px_#FBBF24]">
                  <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                </svg>
              </div>

              {/* Tier 1 (Top Pine Frond) */}
              <div className="relative w-7 h-4 bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 rounded-t-xs shadow-xs" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/70" />
              </div>
              {/* Tier 2 (Middle Pine Frond) */}
              <div className="-mt-1.5 relative w-10 h-5 bg-gradient-to-b from-emerald-500 via-emerald-700 to-emerald-900 rounded-t-xs shadow-xs" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/70" />
                {/* Micro Ornaments */}
                <span className="absolute left-1 top-2 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_3px_#F43F5E]" />
                <span className="absolute right-1.5 top-2.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_3px_#FBBF24]" />
              </div>
              {/* Tier 3 (Bottom Pine Frond) */}
              <div className="-mt-2 relative w-13 h-6 bg-gradient-to-b from-emerald-600 via-emerald-800 to-emerald-950 rounded-t-xs shadow-xs" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/80" />
                {/* Micro Ornaments */}
                <span className="absolute left-2.5 top-3 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_3px_#38BDF8]" />
                <span className="absolute right-3 top-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_3px_#F43F5E]" />
              </div>

              {/* Wooden Trunk */}
              <div className="w-3 h-2.5 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-xs shadow-xs" />
            </div>

            {/* Swirling Glass Micro Snow Flakes */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <span className={`star-twinkling absolute top-4 right-5 text-[9px] text-white ${isShaking ? "animate-ping" : ""}`}>❄</span>
              <span className={`star-twinkling absolute bottom-6 left-4 text-[7px] text-white/90 ${isShaking ? "animate-pulse" : ""}`} style={{ animationDelay: "1.2s" }}>•</span>
              <span className={`star-twinkling absolute top-8 left-5 text-[10px] text-white/95 ${isShaking ? "animate-bounce" : ""}`} style={{ animationDelay: "0.6s" }}>❅</span>
              <span className={`star-twinkling absolute top-12 right-4 text-[8px] text-white/80`} style={{ animationDelay: "1.8s" }}>•</span>
              {isShaking && (
                <>
                  <span className="animate-spin absolute top-6 right-8 text-[9px] text-amber-200">✨</span>
                  <span className="animate-ping absolute bottom-7 right-6 text-[10px] text-white">❄</span>
                  <span className="animate-pulse absolute top-10 left-8 text-[8px] text-white">❄</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 3D Parallax Snowfall */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          onAnimationEnd={() => removeSnowflake(flake.id)}
          className="snowflake-3d absolute -top-8 select-none"
          style={
            {
              left: `${flake.left}%`,
              animationDuration: `${flake.duration}s`,
              "--snow-opacity": flake.opacity,
              "--drift-x": `${flake.driftX}px`,
              "--drift-end-x": `${flake.driftEndX}px`,
              filter: flake.depthLayer === "foreground" ? "blur(1.2px)" : "none",
            } as React.CSSProperties
          }
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: `${flake.size}px`, height: `${flake.size}px` }}
            className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="5" y1="19" x2="19" y2="5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </div>
      ))}

      {/* 4. Realistic 3D Santa's Sleigh with Reindeer & Magical Starlight Wake */}
      {sleigh && (
        <div
          key={sleigh.id}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) {
              removeSleigh();
            }
          }}
          className="santa-flying-3d absolute left-0 pointer-events-none z-30 select-none"
          style={{
            top: "calc(5.5rem + 4vh)",
            animationDuration: `${sleigh.duration}s`,
            width: "480px",
            maxWidth: "92vw",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="relative w-full">
            {/* Ambient Golden Fairy Dust Halo Behind the Sleigh */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-64 h-16 bg-gradient-to-r from-transparent via-amber-400/35 to-amber-200/10 blur-xl pointer-events-none -rotate-2" />

            <svg
              viewBox="0 0 480 160"
              fill="none"
              className="w-full overflow-visible drop-shadow-[0_8px_24px_rgba(251,191,36,0.75)]"
            >
              <defs>
                {/* 3D Glossy Sleigh Lacquer Gradient */}
                <linearGradient id="sleighRed3D" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF5C6C" />
                  <stop offset="25%" stopColor="#E61E34" />
                  <stop offset="65%" stopColor="#A80D1D" />
                  <stop offset="100%" stopColor="#4A000A" />
                </linearGradient>

                {/* 3D Metallic Polished Gold Gradient */}
                <linearGradient id="goldRunner3D" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="25%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#FFFBEB" />
                  <stop offset="75%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>

                {/* Lead Reindeer (Rudolph) Fur Gradient */}
                <linearGradient id="reindeerLeadCoat" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#C97A3E" />
                  <stop offset="40%" stopColor="#964B15" />
                  <stop offset="85%" stopColor="#5C2C0A" />
                  <stop offset="100%" stopColor="#381804" />
                </linearGradient>

                {/* Staggered Companion Reindeer Fur Gradient (Darker for depth) */}
                <linearGradient id="reindeerBackCoat" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A85F2C" />
                  <stop offset="50%" stopColor="#78350F" />
                  <stop offset="100%" stopColor="#2E1204" />
                </linearGradient>

                {/* Branching Antlers Gradient */}
                <linearGradient id="antlersGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#FDE68A" />
                </linearGradient>

                {/* Rudolph's Luminous Glowing Red Nose */}
                <radialGradient id="rudolphNoseGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FF1E44" />
                  <stop offset="80%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#991B1B" />
                </radialGradient>

                {/* Santa's Fluffy White Fur Trim */}
                <linearGradient id="whiteFurGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#F1F5F9" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>

                {/* Toy Sack Burlap Gradient */}
                <linearGradient id="toySackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D4A373" />
                  <stop offset="50%" stopColor="#9C6644" />
                  <stop offset="100%" stopColor="#58311B" />
                </linearGradient>
              </defs>

              {/* 1. Trailing Magical Starlight Wake (Fairy Dust Particles) */}
              <g className="starlight-particles">
                <path
                  d="M 5 130 Q 50 145 105 132 Q 160 120 220 128"
                  stroke="url(#goldRunner3D)"
                  strokeWidth="2"
                  opacity="0.6"
                  strokeDasharray="6 4"
                />
                {/* Starburst Sparkles */}
                <circle cx="18" cy="126" r="3" fill="#FDE047" className="drop-shadow-[0_0_8px_#F59E0B]" />
                <circle cx="18" cy="126" r="1.2" fill="#FFFFFF" />
                <circle cx="45" cy="138" r="4" fill="#FBBF24" className="drop-shadow-[0_0_6px_#F59E0B]" />
                <circle cx="45" cy="138" r="1.5" fill="#FFFFFF" />
                <circle cx="85" cy="122" r="3.5" fill="#FDE047" className="drop-shadow-[0_0_6px_#F59E0B]" />
                <circle cx="130" cy="132" r="4.5" fill="#FBBF24" className="drop-shadow-[0_0_8px_#F59E0B]" />
                <circle cx="130" cy="132" r="1.8" fill="#FFFFFF" />
                <circle cx="180" cy="124" r="3" fill="#FDE047" />
              </g>

              {/* 2. COMPANION REINDEER (Back Layer for 3D Herd Depth) */}
              <g fill="url(#reindeerBackCoat)" opacity="0.88">
                {/* Antlers */}
                <path
                  d="M 334 38 C 330 26, 322 16, 318 10 M 331 32 C 334 26, 340 24, 343 26 M 326 22 C 331 18, 336 17, 338 20"
                  stroke="url(#antlersGrad)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* Head, Ears & Muzzle */}
                <path d="M 328 44 C 334 38, 348 40, 354 48 C 356 50, 350 56, 342 56 C 334 56, 326 50, 328 44 Z" />
                <path d="M 330 40 L 324 35 L 328 32 Z" />
                {/* Neck & Body */}
                <path d="M 336 50 C 330 62, 318 72, 306 74 C 290 76, 274 74, 260 68 C 256 64, 258 58, 264 54 C 284 56, 308 52, 328 44 Z" />
                {/* Reaching Forelegs */}
                <path d="M 314 72 C 322 84, 332 96, 344 102 L 348 100 C 336 94, 326 82, 318 70 Z" fill="#6A2E07" />
                <path d="M 308 73 C 314 86, 324 102, 334 110 L 338 108 C 328 100, 318 84, 312 72 Z" fill="#4E2004" />
                {/* Kicking Hindlegs */}
                <path d="M 268 66 C 258 78, 246 94, 234 104 L 230 101 C 242 90, 254 74, 264 64 Z" fill="#4E2004" />
                <path d="M 262 64 C 252 76, 238 88, 224 96 L 221 93 C 235 84, 248 72, 258 62 Z" fill="#6A2E07" />
                {/* Red Harness */}
                <path d="M 326 54 C 320 64, 312 70, 304 73" stroke="#DC2626" strokeWidth="2.5" />
                <circle cx="322" cy="58" r="2" fill="#FBBF24" />
                <circle cx="316" cy="65" r="2" fill="#FBBF24" />
              </g>

              {/* 3. LEAD REINDEER (Rudolph in Foreground, Proud & Mighty) */}
              <g>
                {/* Grand Majestic Branching Antlers */}
                <path
                  d="M 444 32 C 440 18, 432 8, 426 2 M 441 25 C 445 18, 453 16, 457 18 M 435 15 C 442 10, 448 9, 452 12 M 428 6 C 432 1, 436 0, 440 2"
                  stroke="url(#antlersGrad)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* Muscular Deer Body */}
                <path
                  d="M 436 40 C 446 34, 460 38, 468 46 C 472 50, 464 58, 452 58 C 442 58, 434 50, 436 40 Z"
                  fill="url(#reindeerLeadCoat)"
                />
                {/* Alert Pointed Ear & Dark Eye */}
                <path d="M 438 36 L 430 30 L 434 26 Z" fill="#6A2E07" />
                <circle cx="452" cy="44" r="2" fill="#1C1917" />
                <circle cx="453" cy="43" r="0.6" fill="#FFFFFF" />

                {/* Powerful Arched Neck, Flank & Tail */}
                <path
                  d="M 446 46 C 440 60, 426 72, 412 76 C 394 78, 376 76, 360 70 C 356 66, 358 58, 366 54 C 388 57, 414 52, 436 42 Z"
                  fill="url(#reindeerLeadCoat)"
                />
                <path d="M 358 68 C 354 70, 352 76, 356 78 Z" fill="#FFFFFF" />

                {/* Powerful Reaching Galloping Forelegs */}
                <path d="M 422 74 C 430 88, 442 102, 456 108 L 460 106 C 446 99, 434 85, 426 72 Z" fill="url(#reindeerLeadCoat)" />
                <path d="M 416 75 C 422 90, 434 108, 446 116 L 450 114 C 438 105, 426 88, 420 73 Z" fill="#5C2C0A" />
                {/* Golden Hooves */}
                <polygon points="456,108 462,106 460,111" fill="#1C1917" />
                <polygon points="446,116 452,114 450,119" fill="#1C1917" />

                {/* Powerful Kicking Galloping Hindlegs */}
                <path d="M 374 68 C 362 82, 348 100, 334 112 L 330 109 C 344 96, 358 78, 370 66 Z" fill="#5C2C0A" />
                <path d="M 366 66 C 354 80, 338 94, 322 104 L 318 101 C 334 91, 350 76, 362 64 Z" fill="url(#reindeerLeadCoat)" />
                {/* Golden Hooves */}
                <polygon points="334,112 330,109 328,114" fill="#1C1917" />
                <polygon points="322,104 318,101 316,106" fill="#1C1917" />

                {/* Rudolph's Red Collar Harness with Shiny Golden Bells */}
                <path d="M 436 50 C 428 62, 418 70, 408 74" stroke="#DC2626" strokeWidth="3" />
                <circle cx="432" cy="54" r="2.5" fill="#FBBF24" className="drop-shadow-[0_0_3px_#F59E0B]" />
                <circle cx="424" cy="62" r="2.5" fill="#FBBF24" className="drop-shadow-[0_0_3px_#F59E0B]" />
                <circle cx="414" cy="70" r="2.5" fill="#FBBF24" className="drop-shadow-[0_0_3px_#F59E0B]" />

                {/* Rudolph's Iconic Glowing Red Nose (Radiant Starburst) */}
                <circle cx="470" cy="50" r="6" fill="url(#rudolphNoseGlow)" className="drop-shadow-[0_0_12px_#EF4444]" />
                <circle cx="470" cy="50" r="2.5" fill="#FFFFFF" />
              </g>

              {/* 4. Taut Golden Reins (Connecting Santa to Reindeer) */}
              <g>
                <path
                  d="M 162 66 C 220 70, 300 72, 380 72 C 405 72, 420 68, 434 56"
                  stroke="url(#goldRunner3D)"
                  strokeWidth="2.2"
                  strokeDasharray="6 2"
                  className="drop-shadow-[0_0_4px_#FBBF24]"
                />
                <path
                  d="M 162 68 C 210 74, 270 78, 330 76"
                  stroke="url(#goldRunner3D)"
                  strokeWidth="1.8"
                  opacity="0.8"
                />
              </g>

              {/* 5. OVERFLOWING SACK OF PRESENTS & TOYS (Sleigh Cargo) */}
              <g>
                {/* Big Burlap / Velvet Toy Sack */}
                <path
                  d="M 72 82 C 60 62, 68 40, 92 34 C 114 30, 134 44, 134 76 Z"
                  fill="url(#toySackGrad)"
                  stroke="#43281C"
                  strokeWidth="1"
                />
                {/* Tied Rope at Top */}
                <ellipse cx="102" cy="40" rx="14" ry="4" fill="url(#goldRunner3D)" />

                {/* Emerald Green Present with Gold Ribbon */}
                <polygon points="80,26 96,24 100,40 84,42" fill="#059669" stroke="#047857" strokeWidth="0.8" />
                <line x1="88" y1="25" x2="92" y2="41" stroke="#FBBF24" strokeWidth="2.5" />
                <line x1="82" y1="34" x2="98" y2="32" stroke="#FBBF24" strokeWidth="2.5" />

                {/* Ruby Present with Gold Bow */}
                <polygon points="102,22 118,26 114,42 98,38" fill="#DC2626" stroke="#B91C1C" strokeWidth="0.8" />
                <circle cx="110" cy="24" r="3" fill="#FBBF24" />

                {/* Striped Candy Cane */}
                <path
                  d="M 72 32 C 70 20, 80 16, 86 22 L 78 44"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M 72 32 C 70 20, 80 16, 86 22 L 78 44"
                  stroke="#EF4444"
                  strokeWidth="4"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </g>

              {/* 6. SANTA CLAUS HIMSELF (Jovial, Cheerful in 3D) */}
              <g>
                {/* Crimson Coat Torso */}
                <path
                  d="M 124 62 C 128 50, 146 48, 162 52 L 168 80 C 146 84, 130 82, 124 62 Z"
                  fill="#DC2626"
                />
                {/* White Fur Trim on Coat */}
                <path d="M 144 54 L 148 78" stroke="url(#whiteFurGrad)" strokeWidth="6" strokeLinecap="round" />
                {/* Black Leather Belt with Gleaming Gold Buckle */}
                <path d="M 128 72 C 140 74, 154 75, 166 73" stroke="#18181B" strokeWidth="6" />
                <rect x="142" y="68" width="9" height="8" rx="1.5" fill="none" stroke="url(#goldRunner3D)" strokeWidth="2" />

                {/* Santa's Rosy Cheerful Face */}
                <circle cx="148" cy="42" r="9" fill="#FED7AA" />
                <circle cx="144" cy="43" r="2.5" fill="#FDA4AF" opacity="0.85" />
                <circle cx="152" cy="43" r="2.5" fill="#FDA4AF" opacity="0.85" />
                {/* Twinkling Happy Eyes */}
                <path d="M 143 40 Q 145 38 147 40" stroke="#18181B" strokeWidth="1.2" fill="none" />
                <path d="M 149 40 Q 151 38 153 40" stroke="#18181B" strokeWidth="1.2" fill="none" />

                {/* Volumetric White Flowing Moustache & 3D Beard */}
                <path
                  d="M 140 44 C 136 54, 140 70, 148 74 C 158 70, 162 54, 156 44 C 152 47, 144 47, 140 44 Z"
                  fill="url(#whiteFurGrad)"
                  stroke="#E2E8F0"
                  strokeWidth="0.8"
                />

                {/* Classic Floppy Red Nightcap Hat */}
                <path
                  d="M 139 38 C 139 26, 154 18, 172 24 C 166 32, 156 38, 139 38 Z"
                  fill="#DC2626"
                />
                {/* Fluffy Hat Brim & Pompom */}
                <path d="M 137 38 C 145 36, 155 37, 162 40" stroke="url(#whiteFurGrad)" strokeWidth="5" strokeLinecap="round" />
                <circle cx="174" cy="24" r="5" fill="url(#whiteFurGrad)" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />

                {/* Arm Holding Reins / Waving Glove */}
                <path d="M 154 58 C 160 62, 166 66, 170 66" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
                <circle cx="172" cy="66" r="4.5" fill="url(#whiteFurGrad)" />
              </g>

              {/* 7. VICTORIAN SLEIGH CARRIAGE (Deep Crimson Hull & Baroque Gold Trim) */}
              <g>
                {/* Sleigh Main Hull */}
                <path
                  d="M 54 78 C 42 94, 46 112, 70 114 L 178 116 C 196 116, 204 104, 196 90 C 190 80, 176 82, 168 85 L 86 80 C 74 68, 60 68, 54 78 Z"
                  fill="url(#sleighRed3D)"
                  stroke="#FFE4E6"
                  strokeWidth="0.6"
                />

                {/* Scrolled Baroque Gilded Upper Rim */}
                <path
                  d="M 54 78 C 64 68, 80 78, 96 81 L 170 85 C 182 82, 196 82, 198 92"
                  stroke="url(#goldRunner3D)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-[0_1px_4px_#F59E0B]"
                />

                {/* Sleigh Carriage Hanging Brass Lantern */}
                <g>
                  <line x1="192" y1="92" x2="192" y2="100" stroke="url(#goldRunner3D)" strokeWidth="1.5" />
                  <rect x="189" y="100" width="6" height="8" rx="1" fill="#FDE047" stroke="url(#goldRunner3D)" strokeWidth="1" className="drop-shadow-[0_0_8px_#F59E0B]" />
                  <circle cx="192" cy="104" r="2" fill="#FFFFFF" />
                </g>

                {/* Dual Curled Golden Sleigh Runners */}
                {/* Front & Rear Support Struts */}
                <line x1="80" y1="112" x2="84" y2="128" stroke="url(#goldRunner3D)" strokeWidth="3" strokeLinecap="round" />
                <line x1="126" y1="114" x2="128" y2="129" stroke="url(#goldRunner3D)" strokeWidth="3" strokeLinecap="round" />
                <line x1="170" y1="114" x2="172" y2="130" stroke="url(#goldRunner3D)" strokeWidth="3" strokeLinecap="round" />

                {/* Magnificent Curled Golden Runner */}
                <path
                  d="M 40 128 C 32 122, 34 112, 44 110 C 54 108, 64 118, 76 126 L 195 131 C 212 131, 222 122, 218 108 C 214 98, 202 96, 196 102"
                  stroke="url(#goldRunner3D)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="drop-shadow-[0_2px_8px_#D97706]"
                />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 5. Dropped Christmas Gift with Parachute Falling from Santa in the Center */}
      {droppedGift && (
        <div
          key={droppedGift.id}
          onClick={handleGiftClick}
          className={`absolute left-1/2 pointer-events-auto select-none z-40 ${
            droppedGift.status === "falling"
              ? "gift-dropping"
              : droppedGift.status === "landed"
              ? "gift-resting-bob cursor-pointer"
              : "cursor-default"
          }`}
          style={{
            top: "calc(5.5rem + 4vh + 60px)",
            transform:
              droppedGift.status === "falling"
                ? undefined
                : "translate3d(-50%, 310px, 0)",
          }}
          title={
            droppedGift.status === "landed"
              ? "Tap to open your Holiday Gift! 🎁✨"
              : undefined
          }
        >
          {/* Landing / Opened Celebration Banner */}
          {droppedGift.status === "landed" && (
            <div className="speech-bubble-pop absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 px-3.5 py-1 text-[11px] font-sans font-bold text-white shadow-xl border border-amber-300 pointer-events-none flex items-center gap-1.5 animate-bounce">
              <span>🎁</span>
              <span>Holiday Gift Delivered! Tap to open! ✨</span>
            </div>
          )}

          {droppedGift.status === "opened" && (
            <div className="speech-bubble-pop absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-4 py-1.5 font-sans font-bold text-white shadow-2xl border-2 border-amber-300 pointer-events-none flex items-center gap-1.5 animate-pulse">
              <span>🌟</span>
              <span>Merry Christmas! Joy & Magic across time! 🎄</span>
            </div>
          )}

          {/* Golden Starlight Halo Around Gift */}
          <div className="absolute -inset-4 rounded-full bg-amber-400/25 blur-md pointer-events-none" />

          {/* Parachute on top (visible while falling, folds away on landing) */}
          <div
            className={`flex flex-col items-center ${
              droppedGift.status === "falling" ? "block" : "parachute-fade"
            }`}
          >
            {/* Parachute Canopy SVG */}
            <svg
              viewBox="0 0 90 55"
              className="w-20 h-12 overflow-visible drop-shadow-[0_2px_8px_rgba(225,29,72,0.6)]"
            >
              <defs>
                <linearGradient id="chuteRed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#BE123C" />
                  <stop offset="50%" stopColor="#FB7185" />
                  <stop offset="100%" stopColor="#9F1239" />
                </linearGradient>
                <linearGradient id="chuteGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="50%" stopColor="#FFFBEB" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>
              {/* Canopy Panels */}
              <path
                d="M 5 38 C 5 10, 45 4, 45 4 C 45 4, 85 10, 85 38 C 75 42, 65 39, 58 38 C 50 39, 40 39, 32 38 C 25 39, 15 42, 5 38 Z"
                fill="url(#chuteRed)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
              />
              {/* Gold Stripes */}
              <path
                d="M 22 17 C 28 26, 30 35, 32 38 C 40 39, 50 39, 58 38 C 60 35, 62 26, 68 17 C 56 12, 34 12, 22 17 Z"
                fill="url(#chuteGold)"
                opacity="0.95"
              />
              {/* Center Panel Scallop */}
              <path
                d="M 38 7 C 42 18, 43 28, 45 38"
                stroke="#FFEAA7"
                strokeWidth="1"
                fill="none"
                opacity="0.8"
              />
              {/* Suspension Cords Converging to Bottom Center */}
              <line x1="6" y1="38" x2="45" y2="54" stroke="#FFD166" strokeWidth="1.2" opacity="0.85" />
              <line x1="32" y1="38" x2="45" y2="54" stroke="#FFD166" strokeWidth="1.2" opacity="0.85" />
              <line x1="58" y1="38" x2="45" y2="54" stroke="#FFD166" strokeWidth="1.2" opacity="0.85" />
              <line x1="84" y1="38" x2="45" y2="54" stroke="#FFD166" strokeWidth="1.2" opacity="0.85" />
            </svg>
          </div>

          {/* 3D Wrapped Christmas Gift Box */}
          <div
            className={`relative flex items-center justify-center -mt-1 ${
              droppedGift.status === "landed" ? "gift-landed-bounce" : ""
            }`}
          >
            <svg
              viewBox="0 0 60 60"
              className="w-13 h-13 overflow-visible drop-shadow-[0_4px_16px_rgba(251,191,36,0.9)] transition-transform duration-200 hover:scale-110 active:scale-95"
            >
              <defs>
                <linearGradient id="boxVelvetRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF385C" />
                  <stop offset="45%" stopColor="#E11D48" />
                  <stop offset="85%" stopColor="#9F1239" />
                  <stop offset="100%" stopColor="#5B051A" />
                </linearGradient>
                <linearGradient id="boxLidRed" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B8B" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
                <linearGradient id="satinGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="35%" stopColor="#FDE68A" />
                  <stop offset="65%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>

              {/* Main Cube Body */}
              <rect
                x="10"
                y="18"
                width="40"
                height="34"
                rx="4"
                fill="url(#boxVelvetRed)"
                stroke="#FFE4E6"
                strokeWidth="0.8"
              />
              {/* Lid Rim */}
              <rect
                x="7"
                y="14"
                width="46"
                height="8"
                rx="2.5"
                fill="url(#boxLidRed)"
                stroke="#FFE4E6"
                strokeWidth="0.8"
              />

              {/* Vertical Gold Ribbon */}
              <rect x="26" y="14" width="8" height="38" fill="url(#satinGold)" />
              {/* Horizontal Gold Ribbon */}
              <rect x="10" y="30" width="40" height="7" fill="url(#satinGold)" />

              {/* Big Double-Loop Golden Ribbon Bow */}
              <path
                d="M 30 14 C 20 6, 12 10, 18 15 C 24 16, 28 14, 30 14 Z"
                fill="url(#satinGold)"
                stroke="#FFFBEB"
                strokeWidth="0.8"
              />
              <path
                d="M 30 14 C 40 6, 48 10, 42 15 C 36 16, 32 14, 30 14 Z"
                fill="url(#satinGold)"
                stroke="#FFFBEB"
                strokeWidth="0.8"
              />
              <circle cx="30" cy="14" r="3.5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1" />
              <path
                d="M 28 15 Q 24 24 20 28"
                stroke="url(#satinGold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 32 15 Q 36 24 40 28"
                stroke="url(#satinGold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Sparkle Flares */}
              <circle cx="48" cy="22" r="1.5" fill="#FFF" className="animate-ping" />
              <circle cx="14" cy="42" r="1.2" fill="#FFEAA7" className="animate-pulse" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
