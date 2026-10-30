"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ThemeIntensity } from "@/types";
import { playDiwaliSparkle } from "@/lib/seasonal-audio";

interface FireworkRocket {
  id: number;
  launchDelay: number; // seconds
  rocketDuration: number; // seconds
  targetX: number; // vw offset (negative = toward left)
  targetY: number; // vh offset (negative = upward)
  colorTheme: string[];
  particleCount: number;
}

interface DiwaliEffectsProps {
  intensity?: ThemeIntensity;
  isContained?: boolean;
}

const DIWALI_GREETINGS = [
  "Shubh Deepavali! 🪔",
  "Happy Diwali! ✨",
  "Festival of Lights! 🎆",
  "Prosperity & Radiance! 🪔",
  "May your light shine bright! 🌟",
  "Auspicious memories! 🕯️",
];

// Festive Indian Firework Color Palettes
const FIREWORK_PALETTES = [
  ["#FFB703", "#FFD166", "#FB8500", "#FFF3B0"], // Royal Gold & Amber
  ["#FF0054", "#FF5400", "#FFBD00", "#9E0059"], // Crimson & Saffron Ruby
  ["#06D6A0", "#118AB2", "#FFD166", "#70E000"], // Emerald & Turquoise
  ["#9D4EDD", "#C77DFF", "#FFB703", "#E0AAFF"], // Royal Amethyst & Gold
  ["#4CC9F0", "#4895EF", "#4361EE", "#F72585"], // Sparkling Starburst
];

export default function DiwaliEffects({
  intensity = 2,
  isContained = false,
}: DiwaliEffectsProps) {
  const [rockets, setRockets] = useState<FireworkRocket[]>([]);
  const [activeBursts, setActiveBursts] = useState<number[]>([]);
  const [isSwarming, setIsSwarming] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const nextId = useRef(1);
  const isSwarmingRef = useRef(false);
  const greetingTimeout = useRef<NodeJS.Timeout | null>(null);
  const showCooldownTimeout = useRef<NodeJS.Timeout | null>(null);
  const burstTimers = useRef<NodeJS.Timeout[]>([]);

  // Statically seeded rising stardust embers from the Diya flame
  const diyaEmbers = useMemo(() => {
    const list = [];
    const count = intensity === 1 ? 8 : intensity === 2 ? 14 : 20;
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        dx: ((i * 13) % 36) - 18,
        delay: ((i * 0.3) % 2.4).toFixed(1),
        duration: (2.2 + (i % 3) * 0.4).toFixed(1),
        size: (i % 3) + 2,
      });
    }
    return list;
  }, [intensity]);

  // Handle Diya Tap/Click: Launches an epic fireworks display into the sky!
  const handleDiyaClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // Debounce guard: only 1 full firework show at a time
    if (isSwarmingRef.current || rockets.length > 0) {
      return;
    }

    isSwarmingRef.current = true;
    setIsSwarming(true);
    setIsBouncing(true);
    setBurstCount((prev) => prev + 1);

    // Pick a cheerful auspicious greeting
    const randomQuote =
      DIWALI_GREETINGS[Math.floor(Math.random() * DIWALI_GREETINGS.length)];
    setGreeting(randomQuote);

    // Play sparkling festive chime
    playDiwaliSparkle();

    // Rocket counts scaled by intensity
    const rocketCount = intensity === 1 ? 4 : intensity === 2 ? 6 : 9;
    const newRockets: FireworkRocket[] = [];
    let maxShowDuration = 0;

    // Clear previous burst timers
    burstTimers.current.forEach((t) => clearTimeout(t));
    burstTimers.current = [];
    setActiveBursts([]);

    for (let i = 0; i < rocketCount; i++) {
      const launchDelay = Number((i * 0.35 + Math.random() * 0.15).toFixed(2));
      const rocketDuration = Number((0.85 + Math.random() * 0.35).toFixed(2));

      // Spread targets across upper & mid screen (from -25vw to -85vw horizontally, -35vh to -75vh vertically)
      const targetX = -25 - (i * (60 / (rocketCount - 1 || 1))) + (Math.random() * 10 - 5);
      const targetY = -40 - (Math.random() * 35); // 40vh to 75vh upward
      const colorTheme = FIREWORK_PALETTES[i % FIREWORK_PALETTES.length];
      const particleCount = intensity === 1 ? 14 : intensity === 2 ? 18 : 24;

      const rocketId = nextId.current++;
      newRockets.push({
        id: rocketId,
        launchDelay,
        rocketDuration,
        targetX: Math.round(targetX),
        targetY: Math.round(targetY),
        colorTheme,
        particleCount,
      });

      // Detonate burst exactly when rocket reaches apex
      const burstTriggerTimeMs = (launchDelay + rocketDuration) * 1000;
      const bTimer = setTimeout(() => {
        setActiveBursts((prev) => [...prev, rocketId]);
      }, burstTriggerTimeMs);
      burstTimers.current.push(bTimer);

      const totalTime = launchDelay + rocketDuration + 1.5;
      if (totalTime > maxShowDuration) {
        maxShowDuration = totalTime;
      }
    }

    setRockets(newRockets);

    // Release show lock after the whole sky display concludes
    if (showCooldownTimeout.current) clearTimeout(showCooldownTimeout.current);
    showCooldownTimeout.current = setTimeout(() => {
      isSwarmingRef.current = false;
      setIsSwarming(false);
      setRockets([]);
      setActiveBursts([]);
    }, Math.round(maxShowDuration * 1000 + 400));

    if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
    greetingTimeout.current = setTimeout(() => {
      setGreeting(null);
    }, 2800);

    setTimeout(() => {
      setIsBouncing(false);
    }, 650);
  };

  // 3D Parallax Tilt on Diya Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMouseTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
      if (showCooldownTimeout.current) clearTimeout(showCooldownTimeout.current);
      burstTimers.current.forEach((t) => clearTimeout(t));
      isSwarmingRef.current = false;
      setRockets([]);
      setActiveBursts([]);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none ${isContained ? "absolute" : "fixed"} inset-0 z-40 overflow-hidden`}
      style={{ perspective: "1200px" }}
      aria-hidden="true"
    >
      {/* 1. Sky Fireworks Layer: Rockets & Starburst Particle Clouds */}
      <div
        className="pointer-events-none absolute right-4 sm:right-8 bottom-6 sm:bottom-10 w-24 h-24 sm:w-28 sm:h-28 z-50"
        style={{ perspective: "1200px" }}
      >
        <div className="absolute left-1/2 top-[40%] w-0 h-0 pointer-events-none">
          {rockets.map((rocket) => {
            const isDetonated = activeBursts.includes(rocket.id);

            return (
              <React.Fragment key={rocket.id}>
                {/* Ascending Firework Rocket Trail */}
                {!isDetonated && (
                  <div
                    className="firework-rocket-trail absolute w-2 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={
                      {
                        animationDelay: `${rocket.launchDelay}s`,
                        animationDuration: `${rocket.rocketDuration}s`,
                        "--rocket-tx": `${rocket.targetX}vw`,
                        "--rocket-ty": `${rocket.targetY}vh`,
                        "--rocket-duration": `${rocket.rocketDuration}s`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_12px_#FFD166] animate-ping" />
                    <div className="w-1.5 h-5 -mt-1 mx-auto bg-gradient-to-t from-transparent via-orange-500 to-amber-300 blur-[0.5px]" />
                  </div>
                )}

                {/* Starburst Explosion upon Reaching Target Altitude */}
                {isDetonated && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      transform: `translate3d(${rocket.targetX}vw, ${rocket.targetY}vh, 50px)`,
                    }}
                  >
                    {/* Central Flash */}
                    <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-100 shadow-[0_0_30px_#FFD166] animate-ping opacity-90" />

                    {/* Radial Starburst Sparks */}
                    {Array.from({ length: rocket.particleCount }).map((_, pIdx) => {
                      const angle = (pIdx / rocket.particleCount) * 2 * Math.PI;
                      const distance = 45 + ((pIdx * 17) % 55);
                      const sparkDx = Math.cos(angle) * distance;
                      const sparkDy = Math.sin(angle) * distance;
                      const sparkDz = ((pIdx * 23) % 40) - 20;
                      const color = rocket.colorTheme[pIdx % rocket.colorTheme.length];
                      const sparkSize = (pIdx % 3) + 2.5;

                      return (
                        <div
                          key={pIdx}
                          className="starburst-particle absolute rounded-full pointer-events-none"
                          style={
                            {
                              width: `${sparkSize}px`,
                              height: `${sparkSize}px`,
                              backgroundColor: color,
                              boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
                              "--spark-dx": `${sparkDx}px`,
                              "--spark-dy": `${sparkDy}px`,
                              "--spark-dz": `${sparkDz}px`,
                              "--spark-duration": "1.3s",
                            } as React.CSSProperties
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive 3D Clay & Brass Diya in Bottom Right Corner */}
      <div
        className={`group absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-50 select-none pointer-events-auto ${
          isSwarming ? "cursor-default" : "cursor-pointer"
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleDiyaClick}
        title={isSwarming ? "Fireworks in sky... 🎆" : "Tap for festive fireworks! 🪔"}
      >
        {/* Floating Auspicious Speech Bubble */}
        {greeting ? (
          <div className="speech-bubble-pop absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-950 shadow-xl border border-yellow-200 z-50 pointer-events-none">
            {greeting}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-amber-400 rotate-45 border-r border-b border-yellow-200" />
          </div>
        ) : isSwarming ? (
          /* Active Show Status Badge */
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-950/90 dark:bg-black/90 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-amber-300 border border-amber-400/50 shadow-md flex items-center gap-1 pointer-events-none animate-pulse">
            <span>🎆</span>
            <span>Fireworks soaring...</span>
          </div>
        ) : (
          /* Idle Hint Badge */
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 dark:bg-black/85 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-amber-300 border border-amber-500/35 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all pointer-events-none shadow-sm flex items-center gap-1">
            <span>🪔</span>
            <span>Tap for fireworks!</span>
          </div>
        )}

        {/* 3D Diya Container with Parallax & Squash/Bounce */}
        <div
          className={`diya-3d relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transition-transform duration-150 ${
            isBouncing ? "diya-bouncing" : ""
          }`}
          style={{
            transform: isBouncing
              ? undefined
              : `rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x}deg) scale(1)`,
          }}
        >
          {/* Ambient Ground Shadow & Warm Golden Cast */}
          <div className="absolute -bottom-2 w-22 h-6 rounded-full bg-amber-500/35 blur-md transition-all duration-300 group-hover:bg-amber-400/55" />
          <div className="absolute 0 w-16 h-3 rounded-full bg-slate-950/50 blur-xs" />

          {/* 3D Rendered Traditional Indian Clay & Brass Diya SVG */}
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full drop-shadow-[0_8px_26px_rgba(255,183,3,0.55)] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <defs>
              {/* Terracotta Earthen Base Shading */}
              <radialGradient id="diyaClay" cx="45%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#E06D28" />
                <stop offset="35%" stopColor="#C34A00" />
                <stop offset="75%" stopColor="#8A2B00" />
                <stop offset="100%" stopColor="#541500" />
              </radialGradient>

              {/* Brass Rim Shading */}
              <linearGradient id="diyaBrass" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD166" />
                <stop offset="25%" stopColor="#FFEAA7" />
                <stop offset="60%" stopColor="#D4A017" />
                <stop offset="100%" stopColor="#8C650A" />
              </linearGradient>

              {/* Sacred Golden Ghee Basin */}
              <radialGradient id="gheePool" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF275" />
                <stop offset="45%" stopColor="#FFC300" />
                <stop offset="85%" stopColor="#C77700" />
                <stop offset="100%" stopColor="#7A3E00" />
              </radialGradient>

              {/* Sacred Flame Gradient */}
              <linearGradient id="sacredFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF5400" />
                <stop offset="30%" stopColor="#FF9E00" />
                <stop offset="65%" stopColor="#FFD000" />
                <stop offset="90%" stopColor="#FFF4CC" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>

              {/* Inner Flame Core */}
              <radialGradient id="flameCore" cx="50%" cy="70%" r="40%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#FFF5B8" />
                <stop offset="100%" stopColor="#FFAA00" opacity="0.1" />
              </radialGradient>
            </defs>

            {/* Diya Clay Base / Body */}
            <path
              d="M18 68 C18 92, 42 102, 60 102 C78 102, 102 92, 102 68 C102 65, 96 66, 60 67 C24 66, 18 65, 18 68 Z"
              fill="url(#diyaClay)"
            />

            {/* Base Pedestal Ring */}
            <ellipse cx="60" cy="100" rx="24" ry="5" fill="#421000" opacity="0.75" />
            <ellipse cx="60" cy="98" rx="20" ry="3.5" fill="url(#diyaBrass)" />

            {/* Upper Terracotta Bowl Rim */}
            <ellipse cx="60" cy="67" rx="42" ry="14" fill="url(#diyaClay)" />

            {/* Carved Brass Beaded Rim */}
            <ellipse cx="60" cy="66" rx="40" ry="13" fill="none" stroke="url(#diyaBrass)" strokeWidth="2.5" />

            {/* Glowing Golden Ghee / Oil Pool */}
            <ellipse cx="60" cy="68" rx="34" ry="10" fill="url(#gheePool)" />

            {/* Diya Spout / Beak */}
            <path
              d="M52 64 C52 58, 60 48, 60 48 C60 48, 68 58, 68 64 Z"
              fill="url(#diyaBrass)"
            />

            {/* Cotton Wick (Baati) */}
            <path
              d="M59 62 C58 56, 60 50, 60 46"
              stroke="#402008"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="60" cy="46" r="1.5" fill="#1A0D04" />

            {/* Dancing Sacred 3D Diya Flame */}
            <g className="diya-flame-3d">
              {/* Outer Radiant Aura */}
              <ellipse cx="60" cy="32" rx="14" ry="20" fill="url(#sacredFlame)" opacity="0.35" filter="blur(3px)" />

              {/* Main Flame Teardrop */}
              <path
                d="M60 14 C51 26, 48 36, 52 44 C55 50, 65 50, 68 44 C72 36, 69 26, 60 14 Z"
                fill="url(#sacredFlame)"
              />

              {/* Radiant White/Golden Inner Flame Core */}
              <path
                d="M60 22 C55 30, 53 37, 56 42 C57 44, 63 44, 64 42 C67 37, 65 30, 60 22 Z"
                fill="url(#flameCore)"
              />
            </g>

            {/* Traditional Carved Petal Detailing on the Clay Bowl */}
            <path d="M30 76 Q38 88 46 76" stroke="#FFA352" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M46 78 Q60 92 74 78" stroke="#FFA352" strokeWidth="1.2" fill="none" opacity="0.7" />
            <path d="M74 76 Q82 88 90 76" stroke="#FFA352" strokeWidth="1" fill="none" opacity="0.6" />
          </svg>

          {/* Floating Sacred Golden Embers */}
          <div className="absolute inset-x-0 bottom-10 h-24 pointer-events-none flex justify-center">
            {diyaEmbers.map((em) => (
              <span
                key={`${em.id}-${burstCount}`}
                className="ember-particle absolute rounded-full bg-amber-200"
                style={
                  {
                    width: `${em.size}px`,
                    height: `${em.size}px`,
                    bottom: "22px",
                    left: `calc(50% + ${em.dx}px)`,
                    animationDelay: `${em.delay}s`,
                    animationDuration: `${em.duration}s`,
                    "--ember-dx": `${em.dx * 1.4}px`,
                    boxShadow: "0 0 10px #FFD166, 0 0 18px #FFB703",
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

