"use client";

import React from "react";
import { Lock, Clock, Sparkles } from "lucide-react";

interface CapsuleHero3DProps {
  lidOpenProgress?: number;
  className?: string;
}

export default function CapsuleHero3D({
  className = "w-52 h-52 sm:w-60 sm:h-60",
}: CapsuleHero3DProps) {
  return (
    <div
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      {/* Ambient Starlight Glow Aura */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent blur-2xl" />

      {/* Static 3D Capsule Model */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Top Dome (Lid) */}
        <div className="relative w-28 sm:w-32 h-14 rounded-t-full border-2 border-b-0 border-amber-300/80 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 overflow-hidden flex items-start justify-center pt-2">
          {/* Specular Highlight Streak */}
          <div className="w-16 h-2 rounded-full bg-white/40 blur-[1px]" />
        </div>

        {/* Central Cryptographic Seal Ring */}
        <div className="relative z-10 w-32 sm:w-36 h-9 rounded-md border-y-2 border-amber-300 bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 shadow-inner flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[9px] font-mono tracking-widest text-amber-300 font-bold uppercase">
              SEALED
            </span>
          </div>

          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            <Lock className="h-3 w-3" />
          </div>

          <div className="flex items-center gap-1 text-[9px] font-mono text-amber-400/90">
            <Clock className="h-2.5 w-2.5" />
            <span>UTC</span>
          </div>
        </div>

        {/* Base Cylinder / Body */}
        <div className="relative w-28 sm:w-32 h-24 sm:h-28 rounded-b-full border-2 border-t-0 border-amber-400/80 bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 shadow-xl overflow-hidden flex flex-col items-center justify-end pb-3">
          {/* Vertical Brushed Metallic Highlights */}
          <div className="absolute inset-0 flex justify-around opacity-30 pointer-events-none">
            <div className="w-1 h-full bg-gradient-to-b from-white via-transparent to-black" />
            <div className="w-0.5 h-full bg-gradient-to-b from-amber-200 via-transparent to-black" />
            <div className="w-1.5 h-full bg-gradient-to-b from-white/40 via-transparent to-black" />
          </div>

          {/* Golden Bottom Ring */}
          <div className="w-16 h-3 rounded-full border border-amber-400/40 bg-amber-950/60 flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-amber-400/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
