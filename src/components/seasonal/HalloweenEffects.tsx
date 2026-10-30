"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ThemeIntensity } from "@/types";
import { playSpookyChime } from "@/lib/seasonal-audio";

interface Flying3DBat {
  id: number;
  duration: number; // flight seconds
  delay: number; // launch delay seconds
  size: number; // bat width px
  trajectory: "sky" | "high" | "cross" | "mid" | "swoop" | "low";
  rotationOffset: number; // degree tilt variance
}

interface HalloweenEffectsProps {
  intensity?: ThemeIntensity;
  isContained?: boolean;
}

const SPOOKY_GREETINGS = [
  "BOO! 👻",
  "Bats unleashed! 🦇",
  "Trick or Treat! 🍬",
  "Spooky vibes! 🎃",
  "Swarm taking off! 🦇",
  "Time is a ghost... 🕰️",
  "Cosmic Witchcraft! 🔮",
];

export default function HalloweenEffects({
  intensity = 2,
  isContained = false,
}: HalloweenEffectsProps) {
  const [bats, setBats] = useState<Flying3DBat[]>([]);
  const [isSwarming, setIsSwarming] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [mouthFlash, setMouthFlash] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const nextId = useRef(1);
  const isSwarmingRef = useRef(false);
  const greetingTimeout = useRef<NodeJS.Timeout | null>(null);
  const swarmCooldownTimeout = useRef<NodeJS.Timeout | null>(null);

  // Statically seeded rising embers around the 3D pumpkin
  const embers = useMemo(() => {
    const list = [];
    const count = intensity === 1 ? 6 : intensity === 2 ? 10 : 16;
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        dx: ((i * 17) % 40) - 20,
        delay: ((i * 0.35) % 2.5).toFixed(1),
        duration: (2.2 + (i % 3) * 0.4).toFixed(1),
        size: (i % 3) + 2,
      });
    }
    return list;
  }, [intensity]);

  // Remove bat when its animation ends; unlocks pumpkin once the entire swarm has left the screen
  const removeBat = useCallback((id: number) => {
    setBats((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      if (remaining.length === 0) {
        isSwarmingRef.current = false;
        setIsSwarming(false);
      }
      return remaining;
    });
  }, []);

  // Handle Pumpkin Tap/Click: Bats erupt directly out of the pumpkin's mouth!
  // Locked until all bats have completely flown across the screen.
  const handlePumpkinClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // Guard: strictly ignore clicks while the current swarm is still flying across the screen
    if (isSwarmingRef.current || bats.length > 0) {
      return;
    }

    isSwarmingRef.current = true;
    setIsSwarming(true);
    setIsBouncing(true);
    setMouthFlash(true);
    setBurstCount((prev) => prev + 1);

    // Pick a fun spooky quote
    const randomQuote =
      SPOOKY_GREETINGS[Math.floor(Math.random() * SPOOKY_GREETINGS.length)];
    setGreeting(randomQuote);

    // Play synthesized spooky chime sound
    playSpookyChime();

    // Swarm size scaled by intensity (24 to 48 bats filling full screen)
    const swarmSize = intensity === 1 ? 24 : intensity === 2 ? 36 : 48;
    const trajectories: ("sky" | "high" | "cross" | "mid" | "swoop" | "low")[] = [
      "sky",
      "high",
      "cross",
      "mid",
      "swoop",
      "low",
    ];
    const sizeScale = [26, 34, 42, 50, 60, 70];

    const newSwarm: Flying3DBat[] = [];
    let maxFlightTime = 0;

    for (let i = 0; i < swarmSize; i++) {
      // First bat launches instantly at 0ms, following bats erupt in quick cloud (38ms stagger)
      const launchDelay = i === 0 ? 0 : Number((i * 0.038 + Math.random() * 0.02).toFixed(2));
      const duration = Number((2.8 + (i % 4) * 0.3).toFixed(2)); // 2.8s - 3.7s flight duration
      const totalBatTime = launchDelay + duration;
      if (totalBatTime > maxFlightTime) {
        maxFlightTime = totalBatTime;
      }

      const baseSize = sizeScale[i % sizeScale.length];
      const randomizedSize = Math.max(22, baseSize + Math.round((Math.random() - 0.5) * 8));

      newSwarm.push({
        id: nextId.current++,
        duration,
        delay: launchDelay,
        size: randomizedSize, // 22px up to 74px wingspan
        trajectory: trajectories[i % trajectories.length],
        rotationOffset: Math.round(((i * 13) % 44) - 22),
      });
    }

    setBats(newSwarm);

    // Backup safety cooldown timer: unlocks after all bats have guaranteed exited the screen
    if (swarmCooldownTimeout.current) clearTimeout(swarmCooldownTimeout.current);
    swarmCooldownTimeout.current = setTimeout(() => {
      isSwarmingRef.current = false;
      setIsSwarming(false);
    }, Math.round(maxFlightTime * 1000 + 300));

    if (greetingTimeout.current) clearTimeout(greetingTimeout.current);
    greetingTimeout.current = setTimeout(() => {
      setGreeting(null);
    }, 2800);

    setTimeout(() => {
      setMouthFlash(false);
    }, 450);

    setTimeout(() => {
      setIsBouncing(false);
    }, 650);
  };

  // 3D Parallax Tilt on Pumpkin Hover
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
      if (swarmCooldownTimeout.current) clearTimeout(swarmCooldownTimeout.current);
      isSwarmingRef.current = false;
      setBats([]);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none ${isContained ? "absolute" : "fixed"} inset-0 z-40 overflow-hidden`}
      style={{ perspective: "1200px" }}
      aria-hidden="true"
    >
      {/* Interactive 3D Jack-o'-Lantern Pumpkin Wrapper */}
      <div
        className={`group absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-50 select-none pointer-events-auto ${
          isSwarming ? "cursor-default" : "cursor-pointer"
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handlePumpkinClick}
        title={isSwarming ? "Swarm in flight... 🦇" : "Tap me to release bats! 🎃"}
      >
        {/* Floating Spooky Speech Bubble when Clicked */}
        {greeting ? (
          <div className="speech-bubble-pop absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-950 shadow-lg border border-orange-300 z-50 pointer-events-none">
            {greeting}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-amber-500 rotate-45 border-r border-b border-orange-300" />
          </div>
        ) : isSwarming ? (
          /* Active Flight Status Indicator */
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-950/90 dark:bg-black/90 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-orange-400 border border-orange-500/40 shadow-sm flex items-center gap-1 pointer-events-none animate-pulse">
            <span>🦇</span>
            <span>Bats in flight...</span>
          </div>
        ) : (
          /* Idle Hint Badge */
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 dark:bg-black/85 px-2.5 py-0.5 text-[10px] font-mono tracking-wide text-orange-300 border border-orange-500/30 opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all pointer-events-none shadow-sm flex items-center gap-1">
            <span>🦇</span>
            <span>Tap for bats!</span>
          </div>
        )}

        {/* 3D Pumpkin Container with Mouse Parallax & Squash/Bounce Animation */}
        <div
          className={`pumpkin-3d relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transition-transform duration-150 ${
            isBouncing ? "pumpkin-bouncing" : ""
          }`}
          style={{
            transform: isBouncing
              ? undefined
              : `rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x}deg) scale(1)`,
          }}
        >
          {/* Ambient Ground Shadow & Orange Cast */}
          <div className="absolute -bottom-3 w-20 h-5 rounded-full bg-orange-600/30 blur-md transition-all duration-300 group-hover:bg-orange-500/50" />
          <div className="absolute -bottom-1 w-14 h-3 rounded-full bg-slate-950/60 blur-xs" />

          {/* 3D Rendered Jack-o'-Lantern SVG */}
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full drop-shadow-[0_8px_24px_rgba(255,100,0,0.5)] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <defs>
              {/* Pumpkin 3D Sphere Shading */}
              <radialGradient id="pumpkin3DBall" cx="42%" cy="38%" r="60%">
                <stop offset="0%" stopColor="#FFA64D" />
                <stop offset="35%" stopColor="#FF7A1A" />
                <stop offset="75%" stopColor="#D44E00" />
                <stop offset="100%" stopColor="#7A1D00" />
              </radialGradient>

              {/* Outer Rib Segments */}
              <radialGradient id="outerRib" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FF8B2B" />
                <stop offset="60%" stopColor="#C24400" />
                <stop offset="100%" stopColor="#571400" />
              </radialGradient>

              {/* Glowing Internal Fire Flame */}
              <radialGradient id="candleFire" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF9D2" />
                <stop offset="40%" stopColor="#FFD000" />
                <stop offset="75%" stopColor="#FF6200" />
                <stop offset="100%" stopColor="#CC2200" />
              </radialGradient>

              {/* Stem 3D Gradient */}
              <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#708A38" />
                <stop offset="50%" stopColor="#3F5E18" />
                <stop offset="100%" stopColor="#1E300B" />
              </linearGradient>
            </defs>

            {/* Stem */}
            <path
              d="M58 26 C57 14, 66 10, 74 12 C72 16, 68 18, 64 26 Z"
              fill="url(#stemGrad)"
            />

            {/* Background Rib Lobes */}
            <ellipse cx="38" cy="65" rx="26" ry="32" fill="url(#outerRib)" />
            <ellipse cx="82" cy="65" rx="26" ry="32" fill="url(#outerRib)" />

            {/* Inner Rib Lobes */}
            <ellipse cx="48" cy="67" rx="23" ry="34" fill="url(#pumpkin3DBall)" />
            <ellipse cx="72" cy="67" rx="23" ry="34" fill="url(#pumpkin3DBall)" />

            {/* Center Lobe */}
            <ellipse cx="60" cy="68" rx="21" ry="35" fill="url(#pumpkin3DBall)" />

            {/* Top Depression Shadow */}
            <ellipse cx="60" cy="34" rx="14" ry="4" fill="#3D1200" opacity="0.6" />

            {/* Carved Menacing Glowing Eyes & Nose */}
            <g className="flame-glow-3d" fill="url(#candleFire)">
              {/* Left Eye */}
              <polygon points="40,54 52,60 44,66" />
              {/* Right Eye */}
              <polygon points="80,54 68,60 76,66" />
              {/* Nose */}
              <polygon points="60,66 55,73 65,73" />
              {/* Jagged Smile */}
              <path d="M36 82 Q60 98 84 82 Q76 91 60 92 Q44 91 36 82 Z" />
              {/* Carved Teeth Details */}
              <polygon points="48,82 52,86 54,82" fill="#5A1A00" />
              <polygon points="68,82 70,86 74,82" fill="#5A1A00" />
              <polygon points="58,92 60,88 64,92" fill="#5A1A00" />
            </g>
          </svg>

          {/* Floating Embers */}
          <div className="absolute inset-x-0 bottom-8 h-20 pointer-events-none flex justify-center">
            {embers.map((em) => (
              <span
                key={`${em.id}-${burstCount}`}
                className="ember-particle absolute rounded-full bg-amber-300"
                style={
                  {
                    width: `${em.size}px`,
                    height: `${em.size}px`,
                    bottom: "10px",
                    left: `calc(50% + ${em.dx}px)`,
                    animationDelay: `${em.delay}s`,
                    animationDuration: `${em.duration}s`,
                    "--ember-dx": `${em.dx * 1.5}px`,
                    boxShadow: "0 0 8px #FF9400",
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          {/* Fiery Flash from Mouth upon Click */}
          {mouthFlash && (
            <div className="mouth-fire-flash absolute left-1/2 top-[72%] w-10 h-10 rounded-full bg-gradient-to-r from-amber-300 via-orange-500 to-amber-200 blur-[2px] pointer-events-none z-20" />
          )}
        </div>

        {/* Bats Erupting Directly from Mouth Center (Origin: left 50%, top 72%) */}
        {bats.map((bat) => {
          const animClass =
            bat.trajectory === "sky"
              ? "bat-erupt-sky"
              : bat.trajectory === "high"
              ? "bat-erupt-high"
              : bat.trajectory === "cross"
              ? "bat-erupt-cross"
              : bat.trajectory === "mid"
              ? "bat-erupt-mid"
              : bat.trajectory === "swoop"
              ? "bat-erupt-swoop"
              : "bat-erupt-low";

          const batHeight = Math.round(bat.size * 0.56);

          return (
            <div
              key={bat.id}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) {
                  removeBat(bat.id);
                }
              }}
              className={`${animClass} pointer-events-none`}
              style={{
                position: "absolute",
                left: "50%",
                top: "72%",
                width: `${bat.size}px`,
                height: `${batHeight}px`,
                marginLeft: `-${Math.round(bat.size / 2)}px`,
                marginTop: `-${Math.round(batHeight / 2)}px`,
                animationDuration: `${bat.duration}s`,
                animationDelay: `${bat.delay}s`,
                zIndex: 60,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="relative w-full h-full"
                style={{
                  transform: `rotate(${bat.rotationOffset}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Classic Iconic Silhouette Bat matching the user reference */}
                <svg
                  viewBox="0 0 64 36"
                  className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                >
                  {/* Left Flapping Wing */}
                  <g className="bat-wing-flap-left">
                    <path
                      d="M 32 14 C 24 6, 16 3, 0 8 C 4 14, 9 17, 13 16 C 17 21, 23 23, 27 20 C 29 23, 31 24, 32 24 Z"
                      fill="#0C0814"
                    />
                  </g>
                  {/* Right Flapping Wing */}
                  <g className="bat-wing-flap-right">
                    <path
                      d="M 32 14 C 40 6, 48 3, 64 8 C 60 14, 55 17, 51 16 C 47 21, 41 23, 37 20 C 35 23, 33 24, 32 24 Z"
                      fill="#0C0814"
                    />
                  </g>
                  {/* Sleek Bat Torso with Sharp Gothic Ears and Tail */}
                  <path
                    d="M 30 11 L 28 5 L 31 8 L 32 8 L 33 8 L 36 5 L 34 11 C 36 14, 35 21, 32 27 C 29 21, 28 14, 30 11 Z"
                    fill="#040208"
                  />
                  {/* Glowing Eyes */}
                  <circle cx="30.5" cy="11.5" r="0.8" fill="#FFB703" />
                  <circle cx="33.5" cy="11.5" r="0.8" fill="#FFB703" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
