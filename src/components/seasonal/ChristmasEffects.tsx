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

interface ChristmasEffectsProps {
  intensity?: ThemeIntensity;
  isContained?: boolean;
}

const CHRISTMAS_GREETINGS = [
  "Let it snow! ❄️",
  "Magic in the air! ✨",
  "Warm holiday wishes! 🎁",
  "Peace across time! 🌟",
  "Merry moments! 🎄",
  "Starlit memories! 🕯️",
];

export default function ChristmasEffects({
  intensity = 2,
  isContained = false,
}: ChristmasEffectsProps) {
  const [snowflakes, setSnowflakes] = useState<Snowflake3D[]>([]);
  const [sleigh, setSleigh] = useState<SleighFlight3D | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const nextSnowId = useRef(1);
  const nextSleighId = useRef(1);
  const greetingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Scaled by intensity
  const maxSnow = intensity === 1 ? 16 : intensity === 2 ? 32 : 52;
  const snowIntervalMs = intensity === 1 ? 520 : intensity === 2 ? 300 : 170;
  const sleighIntervalMs = intensity === 1 ? 14000 : intensity === 2 ? 10000 : 8000;

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
    setSleigh(null);
  }, []);

  // Handle Snow Globe Click / Touch (Shake the Globe!)
  const handleGlobeClick = () => {
    setIsShaking(true);
    setBurstCount((prev) => prev + 1);

    // Pick random festive greeting
    const randomQuote =
      CHRISTMAS_GREETINGS[Math.floor(Math.random() * CHRISTMAS_GREETINGS.length)];
    setGreeting(randomQuote);

    // Play sweet festive chime
    playJingleChime();

    // Spawn a flurry of fresh snowflakes
    const flurry: Snowflake3D[] = [];
    for (let i = 0; i < 5; i++) {
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

    if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
    greetingTimeout.current = setTimeout(() => {
      setGreeting(null);
    }, 2400);

    setTimeout(() => {
      setIsShaking(false);
    }, 750);
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

    const spawnSleigh = () => {
      setSleigh({
        id: nextSleighId.current++,
        duration: 7.8,
      });
    };

    const firstSleighTimer = setTimeout(spawnSleigh, 2000);
    const sleighTimer = setInterval(spawnSleigh, sleighIntervalMs);

    return () => {
      clearInterval(snowTimer);
      clearTimeout(firstSleighTimer);
      clearInterval(sleighTimer);
      if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
      setSnowflakes([]);
      setSleigh(null);
    };
  }, [maxSnow, snowIntervalMs, sleighIntervalMs]);

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
        className="absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-30 select-none pointer-events-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleGlobeClick}
        title="Shake the Snow Globe! 🎄"
      >
        {/* Floating Holiday Speech Bubble when Clicked */}
        {greeting && (
          <div className="speech-bubble-pop absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-lg border border-emerald-300 z-40 pointer-events-none">
            {greeting}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-teal-600 rotate-45 border-r border-b border-emerald-300" />
          </div>
        )}

        {/* 3D Snow Globe Container with Mouse Parallax & Shake Animation */}
        <div
          className={`globe-3d relative w-24 h-28 sm:w-28 sm:h-32 flex flex-col items-center justify-end cursor-pointer transition-transform duration-150 ${
            isShaking ? "globe-shaking" : ""
          }`}
          style={{
            transform: isShaking
              ? undefined
              : `rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x}deg) scale(1)`,
          }}
        >
          {/* Ground Soft Glow & Shadow */}
          <div className="absolute bottom-0 w-20 h-4 rounded-full bg-emerald-500/25 blur-md" />

          {/* Golden Ornate Pedestal Base */}
          <div className="relative z-10 w-16 h-5 rounded-md bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700 shadow-md border-t border-amber-200 flex items-center justify-center">
            <div className="w-10 h-1.5 rounded-full bg-amber-950/40 border border-amber-400/40" />
          </div>

          {/* 3D Glass Sphere with Miniature Spinning Pine Tree Inside */}
          <div className="relative -mb-1 w-22 h-22 sm:w-26 sm:h-26 rounded-full border border-white/40 bg-gradient-to-tr from-emerald-950/40 via-cyan-900/20 to-white/20 backdrop-blur-[2px] shadow-[0_0_25px_rgba(52,211,153,0.35)] overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200">
            {/* Top Glass Specular Arc Reflection */}
            <div className="absolute top-2 left-3 w-8 h-4 rounded-full bg-white/60 blur-[0.6px] -rotate-45" />

            {/* 3D Miniature Spinning Tree */}
            <div
              className={`relative w-12 h-14 flex flex-col items-center justify-center ${
                isShaking ? "animate-spin" : "inner-tree-spin"
              }`}
            >
              {/* Golden Tree Topper Star */}
              <div className="star-twinkling -mb-1 z-20">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-300 fill-current drop-shadow-[0_0_6px_#FBBF24]">
                  <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                </svg>
              </div>

              {/* Tier 1 (Top) */}
              <div className="w-6 h-4 bg-gradient-to-b from-emerald-400 to-emerald-700 rounded-t-sm shadow-xs border-b border-emerald-300/40" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
              {/* Tier 2 (Middle) */}
              <div className="-mt-1.5 w-9 h-5 bg-gradient-to-b from-emerald-500 to-emerald-800 rounded-t-sm shadow-xs border-b border-emerald-300/40" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
              {/* Tier 3 (Bottom) */}
              <div className="-mt-2 w-12 h-6 bg-gradient-to-b from-emerald-600 to-emerald-900 rounded-t-sm shadow-xs border-b border-emerald-300/40" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />

              {/* Mini Trunk */}
              <div className="w-2.5 h-2 bg-amber-900 rounded-b-xs" />
            </div>

            {/* Swirling Glass Micro Snow Flakes */}
            <div className="absolute inset-0 pointer-events-none">
              <span className={`star-twinkling absolute top-4 right-5 text-[8px] text-white ${isShaking ? "animate-ping" : ""}`}>❄</span>
              <span className={`star-twinkling absolute bottom-5 left-4 text-[7px] text-white/80 ${isShaking ? "animate-pulse" : ""}`} style={{ animationDelay: "1.2s" }}>•</span>
              <span className={`star-twinkling absolute top-8 left-6 text-[9px] text-white/90 ${isShaking ? "animate-bounce" : ""}`} style={{ animationDelay: "0.6s" }}>❅</span>
              {isShaking && (
                <>
                  <span className="animate-spin absolute top-6 right-8 text-[7px] text-amber-200">✨</span>
                  <span className="animate-ping absolute bottom-7 right-6 text-[8px] text-white">❄</span>
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

      {/* 4. 3D Santa's Sleigh with Reindeer & Magical Particle Ribbon */}
      {sleigh && (
        <div
          key={sleigh.id}
          onAnimationEnd={removeSleigh}
          className="santa-flying-3d absolute left-0"
          style={{
            top: "8%",
            animationDuration: `${sleigh.duration}s`,
            width: "210px",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-44 h-8 bg-gradient-to-r from-transparent via-amber-400/30 to-amber-300/10 blur-md pointer-events-none -rotate-3" />

            <svg
              viewBox="0 0 260 70"
              fill="none"
              className="w-full drop-shadow-[0_4px_16px_rgba(251,191,36,0.8)]"
            >
              <defs>
                <linearGradient id="sleighRed3D" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF4D5E" />
                  <stop offset="45%" stopColor="#E63946" />
                  <stop offset="100%" stopColor="#8A0E17" />
                </linearGradient>

                <linearGradient id="goldRunner3D" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <linearGradient id="reindeerBody3D" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="60%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
              </defs>

              <g fill="url(#reindeerBody3D)">
                <path d="M246 16l5-9m-3 0l-3 4m6-2l5-2M238 20c3-5 7-6 11-5l2 3-4 3-5 1z" />
                <path d="M222 26c4-5 10-5 15-2l4 3-2 8-5-2-3 8-4-1 2-7-5-1-1 8-4-1 1-9z" />
                <circle cx="251" cy="21" r="1.5" fill="#EF4444" className="drop-shadow-[0_0_3px_#EF4444]" />
              </g>

              <g fill="url(#reindeerBody3D)">
                <path d="M206 18l5-9m-3 0l-3 4m6-2l5-2M198 22c3-5 7-6 11-5l2 3-4 3-5 1z" />
                <path d="M182 28c4-5 10-5 15-2l4 3-2 8-5-2-3 8-4-1 2-7-5-1-1 8-4-1 1-9z" />
              </g>

              <path
                d="M120 38 Q150 40 190 30 Q210 27 232 25"
                stroke="url(#goldRunner3D)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              <path
                d="M52 30 C58 20 72 18 88 20 L112 22 C118 22 120 26 118 31 L112 43 C102 48 84 50 66 47 L46 42 C40 38 42 33 52 30 Z"
                fill="url(#sleighRed3D)"
                stroke="#FFE4E6"
                strokeWidth="0.8"
              />

              <circle cx="68" cy="24" r="9" fill="#991B1B" />
              <circle cx="82" cy="20" r="10" fill="#BE123C" />
              <path d="M78 18 C78 12 84 8 90 8 L91 18 Z" fill="#E11D48" />
              <circle cx="92" cy="8" r="2.5" fill="#FFFFFF" />
              <circle cx="84" cy="18" r="4.5" fill="#FED7AA" />

              <path
                d="M40 54 C56 55 110 55 124 52 C132 50 134 45 130 40 M50 50 L56 38 M108 50 L110 38"
                stroke="url(#goldRunner3D)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <circle cx="126" cy="36" r="3.5" fill="#FDE047" className="drop-shadow-[0_0_8px_#F59E0B]" />
              <circle cx="126" cy="36" r="1.5" fill="#FFFFFF" />

              <circle cx="36" cy="40" r="2" fill="#FEF08A" opacity="0.9" />
              <circle cx="24" cy="46" r="1.5" fill="#FEF08A" opacity="0.7" />
              <circle cx="10" cy="42" r="2" fill="#FDE047" opacity="0.5" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
