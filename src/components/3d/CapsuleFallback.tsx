"use client";

import React from "react";
import { Lock, Clock } from "lucide-react";

export default function CapsuleFallback() {
  return (
    <div
      aria-hidden="true"
      className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center select-none"
    >
      {/* Ambient background glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/30 via-amber-500/20 to-transparent blur-2xl animate-pulse" />

      {/* Styled vector 3D capsule illusion */}
      <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-full border-2 border-accent/70 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 shadow-2xl flex flex-col items-center justify-between p-3 overflow-hidden">
        {/* Top Dome Reflection */}
        <div className="w-16 h-4 rounded-full bg-white/30 blur-[1px]" />

        {/* Center Golden Lock Ring */}
        <div className="w-full h-8 bg-amber-950/80 border-y border-amber-400/60 flex items-center justify-center gap-1.5 shadow-inner">
          <Lock className="h-3.5 w-3.5 text-amber-300" />
          <Clock className="h-3 w-3 text-amber-400" />
        </div>

        {/* Bottom Shading */}
        <div className="w-12 h-3 rounded-full bg-amber-950/50" />
      </div>
    </div>
  );
}
