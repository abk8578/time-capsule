"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ThemeIntensity } from "@/types";
import { playDiwaliSparkle } from "@/lib/seasonal-audio";

type BalloonColor = "gold" | "ruby" | "saffron" | "amethyst" | "emerald";

interface CelebrationBalloon {
  id: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
  sway1: number;
  sway2: number;
  endSway: number;
  rot1: number;
  rot2: number;
  color: BalloonColor;
  wish: string;
}

interface DiwaliEffectsProps {
  intensity?: ThemeIntensity;
  isContained?: boolean;
}

const DIWALI_GREETINGS = [
  "✨ Shubh Deepavali! 🎈",
  "🎈 Happy Diwali! May all your wishes fly high! ✨",
  "🌟 Radiance, Joy & Prosperity! 🎈",
  "✨ Light, Peace & Rising Dreams! 🎈",
  "🎈 Cosmic Festival of Lights! ✨",
];

const DIWALI_WISHES = [
  "✨ Shubh Deepavali",
  "🪔 Happy Diwali",
  "🌟 Prosperity & Wealth",
  "💛 Joy & Light",
  "✨ Peace & Harmony",
  "💫 Good Health",
  "🌸 Love & Happiness",
  "🕊️ Serenity",
  "🎆 Bright Horizons",
  "✨ Auspicious Blessings",
  "🌟 Rising Dreams",
  "🏮 Light over Darkness",
  "💖 Endless Smiles",
  "✨ Cosmic Wonder",
  "🎉 New Beginnings",
  "🪔 Bliss & Abundance",
  "🌟 Timeless Memories",
  "✨ Divine Grace",
];

const BALLOON_COLORS: BalloonColor[] = [
  "gold",
  "saffron",
  "ruby",
  "amethyst",
  "emerald",
];

// Reusable SVG Hot Air Paper Balloon Lantern (Tukkal)
function DiwaliBalloonSVG({
  color,
  isHero = false,
}: {
  color: BalloonColor;
  isHero?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 60 72"
      className={`overflow-visible drop-shadow-[0_0_20px_rgba(255,183,3,0.85)] ${
        isHero ? "w-20 h-24 sm:w-24 sm:h-28" : "w-12 h-14 sm:w-14 sm:h-17"
      }`}
    >
      <defs>
        {/* Color Gradient Themes */}
        <linearGradient id={`bgGrad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          {color === "gold" && (
            <>
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="35%" stopColor="#FFD166" />
              <stop offset="75%" stopColor="#FFB703" />
              <stop offset="100%" stopColor="#D97706" />
            </>
          )}
          {color === "saffron" && (
            <>
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="35%" stopColor="#FDBA74" />
              <stop offset="75%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#C2410C" />
            </>
          )}
          {color === "ruby" && (
            <>
              <stop offset="0%" stopColor="#FFE4E6" />
              <stop offset="35%" stopColor="#FB7185" />
              <stop offset="75%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </>
          )}
          {color === "amethyst" && (
            <>
              <stop offset="0%" stopColor="#FAF5FF" />
              <stop offset="35%" stopColor="#D8B4FE" />
              <stop offset="75%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#6B21A8" />
            </>
          )}
          {color === "emerald" && (
            <>
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="35%" stopColor="#6EE7B7" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#065F46" />
            </>
          )}
        </linearGradient>

        {/* Golden Wire Ring Gradient */}
        <linearGradient id="hoopGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="50%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Main Balloon Paper Canopy */}
      <path
        d="M 14 54 C 4 40, 3 18, 15 8 C 23 1.5, 37 1.5, 45 8 C 57 18, 56 40, 46 54 Z"
        fill={`url(#bgGrad-${color})`}
        opacity="0.94"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.9"
      />

      {/* Traditional Vertical Paper Creases / Ribs */}
      <path
        d="M 30 3 C 22 14, 20 36, 23 54"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M 30 3 C 38 14, 40 36, 37 54"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.8"
        fill="none"
      />

      {/* Bottom Bamboo / Brass Wire Hoop Opening */}
      <ellipse
        cx="30"
        cy="54"
        rx="14"
        ry="3.5"
        fill="#3D1200"
        stroke="url(#hoopGold)"
        strokeWidth="1.2"
      />

      {/* Golden Silk Tassel Filaments */}
      <g stroke="#FFD166" strokeWidth="1" strokeLinecap="round" opacity="0.85">
        <line x1="24" y1="56" x2="23" y2="64" />
        <line x1="30" y1="57" x2="30" y2="68" strokeWidth="1.4" />
        <line x1="36" y1="56" x2="37" y2="64" />
      </g>

      {/* Radiant Inner Candle Flame & Golden Aura */}
      <ellipse
        cx="30"
        cy="50"
        rx="6"
        ry="8"
        fill="#FFFFFF"
        className="animate-pulse"
      />
      <ellipse cx="30" cy="51" rx="3.5" ry="5" fill="#FFAA00" />
      <ellipse cx="30" cy="52" rx="2" ry="3" fill="#FF4400" />
    </svg>
  );
}

export default function DiwaliEffects({
  intensity = 2,
  isContained = false,
}: DiwaliEffectsProps) {
  const [celebrationBalloons, setCelebrationBalloons] = useState<CelebrationBalloon[]>([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const nextId = useRef(1);
  const isCelebratingRef = useRef(false);
  const greetingTimeout = useRef<NodeJS.Timeout | null>(null);
  const celebrationCooldown = useRef<NodeJS.Timeout | null>(null);

  // Remove individual celebration balloon once its full animation has completed past the top
  const removeCelebrationBalloon = useCallback((id: number) => {
    setCelebrationBalloons((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      if (remaining.length === 0) {
        isCelebratingRef.current = false;
        setIsCelebrating(false);
      }
      return remaining;
    });
  }, []);

  // Handle tap on the 3D Diwali Sky Balloon in bottom right:
  // Releases a massive, grand swarm of Best-Wishes Diwali Balloons!
  const handleBalloonClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    if (isCelebratingRef.current) return;

    isCelebratingRef.current = true;
    setIsCelebrating(true);
    setIsBouncing(true);

    const randomQuote =
      DIWALI_GREETINGS[Math.floor(Math.random() * DIWALI_GREETINGS.length)];
    setGreeting(randomQuote);

    // Play sweet festive chime
    playDiwaliSparkle();

    // Elegant, well-spaced festive swarm (7 to 12 balloons max - clean, aesthetic & non-overcrowded)
    const swarmSize = intensity === 1 ? 7 : intensity === 2 ? 9 : 12;
    const newSwarm: CelebrationBalloon[] = [];
    let maxFlightTime = 0;

    for (let i = 0; i < swarmSize; i++) {
      // Gentle staggered release (one by one ascending over ~2.5 seconds)
      const delay = Number((i * 0.26).toFixed(2));
      const duration = Number((10.5 + (i % 3) * 0.8).toFixed(1)); // 10.5s - 12.1s graceful float
      const totalTime = delay + duration;
      if (totalTime > maxFlightTime) {
        maxFlightTime = totalTime;
      }

      // Evenly spaced horizontal columns across the screen so balloons never collide or overlap!
      // For 9 balloons: ~7%, 17%, 27%, 38%, 49%, 60%, 71%, 81%, 91%
      const step = 84 / Math.max(1, swarmSize - 1);
      const baseLeft = 8 + i * step;
      const jitter = ((i * 7) % 5) - 2; // subtle +/- 2% organic variance
      const left = Math.max(5, Math.min(93, Math.round(baseLeft + jitter)));

      // Curated auspicious Diwali Best Wish for each balloon
      const wish = DIWALI_WISHES[i % DIWALI_WISHES.length];

      newSwarm.push({
        id: nextId.current++,
        left,
        delay,
        duration,
        scale: Number((0.95 + (i % 3) * 0.1).toFixed(2)), // 0.95 to 1.15 scale for crisp visibility
        sway1: Math.round(((i * 11) % 36) - 18),
        sway2: Math.round(((i * 17) % 40) - 20),
        endSway: Math.round(((i * 23) % 30) - 15),
        rot1: Math.round(((i * 5) % 6) - 3),
        rot2: Math.round(((i * 7) % 6) - 3),
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        wish,
      });
    }

    setCelebrationBalloons(newSwarm);

    // Safety timeout ensures lock is released even if tab becomes backgrounded
    if (celebrationCooldown.current) clearTimeout(celebrationCooldown.current);
    celebrationCooldown.current = setTimeout(() => {
      isCelebratingRef.current = false;
      setIsCelebrating(false);
      setCelebrationBalloons([]);
    }, Math.round((maxFlightTime + 1.2) * 1000));

    if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
    greetingTimeout.current = setTimeout(() => {
      setGreeting(null);
    }, 3500);

    setTimeout(() => {
      setIsBouncing(false);
    }, 650);
  };

  // 3D Mouse Parallax Tilt on Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -24;
    setMouseTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
      if (celebrationCooldown.current) clearTimeout(celebrationCooldown.current);
      isCelebratingRef.current = false;
      setCelebrationBalloons([]);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none ${
        isContained ? "absolute" : "fixed"
      } inset-0 z-40 overflow-hidden select-none`}
      aria-hidden="true"
    >
      {/* =========================================================================
          GRAND SWARM OF BEST-WISHES DIWALI SKY BALLOONS (LAUNCHES ONLY ON TAP)
          Floats smoothly all the way past the top of the viewport
          ========================================================================= */}
      {celebrationBalloons.map((balloon) => (
        <div
          key={balloon.id}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) {
              removeCelebrationBalloon(balloon.id);
            }
          }}
          className="diwali-balloon-burst absolute pointer-events-none"
          style={
            {
              left: `${balloon.left}%`,
              bottom: "-110px",
              animationDelay: `${balloon.delay}s`,
              "--b-duration": `${balloon.duration}s`,
              "--b-scale": balloon.scale,
              "--b-sway1": `${balloon.sway1}px`,
              "--b-sway2": `${balloon.sway2}px`,
              "--b-end-sway": `${balloon.endSway}px`,
              "--b-rot1": `${balloon.rot1}deg`,
              "--b-rot2": `${balloon.rot2}deg`,
              "--b-opacity": 0.96,
              zIndex: 55,
            } as React.CSSProperties
          }
        >
          <div className="relative flex flex-col items-center">
            <DiwaliBalloonSVG color={balloon.color} />
            {/* Hanging Best Wishes Parchment Tag */}
            <div className="wish-tag-flutter -mt-1 flex flex-col items-center pointer-events-none select-none">
              <div className="w-px h-2.5 bg-gradient-to-b from-amber-400 to-amber-200 shadow-[0_0_4px_#FFD166]" />
              <span className="whitespace-nowrap rounded-full bg-slate-950/90 dark:bg-black/90 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-sans font-medium tracking-wide text-amber-300 border border-amber-400/60 shadow-[0_2px_10px_rgba(255,183,3,0.45)] backdrop-blur-xs">
                {balloon.wish}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* =========================================================================
          3. INTERACTIVE 3D DIWALI BALLOON IN BOTTOM RIGHT CORNER
          Hover Parallax Tilt + Tap to launch the Grand Best-Wishes Swarm!
          ========================================================================= */}
      <div
        className={`group absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-50 select-none pointer-events-auto ${
          isCelebrating ? "cursor-default" : "cursor-pointer"
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleBalloonClick}
        title={
          isCelebrating
            ? `${celebrationBalloons.length} Diwali Wishes ascending... 🎈✨`
            : "Tap to launch Best Wishes Balloons! 🎈"
        }
      >
        {/* Festive Speech Bubble when Clicked */}
        {greeting ? (
          <div className="speech-bubble-pop absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-950 shadow-xl border border-yellow-200 z-50 pointer-events-none">
            {greeting}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-yellow-400 rotate-45 border-r border-b border-yellow-200" />
          </div>
        ) : isCelebrating ? (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-950/90 dark:bg-black/90 px-3 py-0.5 text-[10px] font-mono tracking-wide text-amber-300 border border-amber-400/50 shadow-sm flex items-center gap-1.5 pointer-events-none animate-pulse">
            <span>🎈</span>
            <span>{celebrationBalloons.length} Wishes in flight...</span>
          </div>
        ) : (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card/90 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-amber-400 border border-amber-500/40 shadow-xs flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all pointer-events-none">
            <span>🎈</span>
            <span>Tap for Wishes Swarm!</span>
          </div>
        )}

        {/* 3D Balloon Container with Parallax Tilt & Celebration Bounce */}
        <div
          className={`diwali-balloon-anchor relative flex flex-col items-center justify-center transition-transform duration-150 ${
            isBouncing ? "balloon-bouncing" : ""
          }`}
          style={{
            transform: isBouncing
              ? undefined
              : `rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x}deg) scale(1)`,
          }}
        >
          {/* Ambient Golden Ground Glow */}
          <div className="absolute -bottom-2 w-20 h-4 rounded-full bg-amber-500/30 blur-md pointer-events-none group-hover:bg-amber-400/50 transition-colors" />

          {/* Hero 3D Diwali Balloon */}
          <div className="hover:scale-105 active:scale-95 transition-transform duration-200">
            <DiwaliBalloonSVG color="gold" isHero />
          </div>
        </div>
      </div>
    </div>
  );
}
