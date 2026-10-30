"use client";

import React from "react";
import { useSeasonalTheme } from "./SeasonalThemeContext";
import type { SeasonalThemeType } from "@/types";

interface SeasonalLogoDecoratorProps {
  overrideTheme?: SeasonalThemeType;
}

export default function SeasonalLogoDecorator({
  overrideTheme,
}: SeasonalLogoDecoratorProps) {
  const { activeSeason } = useSeasonalTheme();
  const season = overrideTheme || activeSeason;

  if (!season || season === "default") {
    return null;
  }

  if (season === "halloween") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible"
        style={{ perspective: "600px", transformStyle: "preserve-3d" }}
        aria-hidden="true"
      >
        {/* Bat 1: Clockwise 3D Orbit */}
        <div className="bat-orbit-cw absolute flex items-center justify-center">
          <div className="w-6 h-3.5 relative flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ transformStyle: "preserve-3d" }}>
            <svg viewBox="0 0 64 36" className="w-full h-full overflow-visible">
              <g className="bat-wing-flap-left">
                <path d="M 32 14 C 24 6, 16 3, 0 8 C 4 14, 9 17, 13 16 C 17 21, 23 23, 27 20 C 29 23, 31 24, 32 24 Z" fill="#0C0814" />
              </g>
              <g className="bat-wing-flap-right">
                <path d="M 32 14 C 40 6, 48 3, 64 8 C 60 14, 55 17, 51 16 C 47 21, 41 23, 37 20 C 35 23, 33 24, 32 24 Z" fill="#0C0814" />
              </g>
              <path d="M 30 11 L 28 5 L 31 8 L 32 8 L 33 8 L 36 5 L 34 11 C 36 14, 35 21, 32 27 C 29 21, 28 14, 30 11 Z" fill="#040208" />
              <circle cx="30.5" cy="11.5" r="1.2" fill="#FFB703" />
              <circle cx="33.5" cy="11.5" r="1.2" fill="#FFB703" />
            </svg>
          </div>
        </div>

        {/* Bat 2: Counter-Clockwise 3D Orbit */}
        <div className="bat-orbit-ccw absolute flex items-center justify-center">
          <div className="w-5 h-3 relative flex items-center justify-center scale-90 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ transformStyle: "preserve-3d" }}>
            <svg viewBox="0 0 64 36" className="w-full h-full overflow-visible">
              <g className="bat-wing-flap-left">
                <path d="M 32 14 C 24 6, 16 3, 0 8 C 4 14, 9 17, 13 16 C 17 21, 23 23, 27 20 C 29 23, 31 24, 32 24 Z" fill="#0C0814" />
              </g>
              <g className="bat-wing-flap-right">
                <path d="M 32 14 C 40 6, 48 3, 64 8 C 60 14, 55 17, 51 16 C 47 21, 41 23, 37 20 C 35 23, 33 24, 32 24 Z" fill="#0C0814" />
              </g>
              <path d="M 30 11 L 28 5 L 31 8 L 32 8 L 33 8 L 36 5 L 34 11 C 36 14, 35 21, 32 27 C 29 21, 28 14, 30 11 Z" fill="#040208" />
              <circle cx="30.5" cy="11.5" r="1.2" fill="#FFB703" />
              <circle cx="33.5" cy="11.5" r="1.2" fill="#FFB703" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (season === "diwali") {
    return (
      <div
        className="pointer-events-none absolute -top-2.5 -right-2.5 z-20 overflow-visible"
        aria-hidden="true"
      >
        {/* Floating Mini Diya & Dancing Sacred Flame on Logo */}
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 28 28"
            className="w-5 h-5 drop-shadow-[0_0_12px_rgba(255,183,3,0.95)] animate-pulse"
          >
            <defs>
              <linearGradient id="miniDiyaFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF5400" />
                <stop offset="50%" stopColor="#FFD000" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            {/* Mini Terracotta Bowl */}
            <path d="M4 17 C4 23, 10 25, 14 25 C18 25, 24 23, 24 17 Z" fill="#C34A00" stroke="#FFD166" strokeWidth="0.8" />
            <ellipse cx="14" cy="17" rx="10" ry="3" fill="#FFB703" />
            {/* Mini Sacred Flame */}
            <path
              d="M14 4 C11 9, 10 13, 12 16 C13 17, 15 17, 16 16 C18 13, 17 9, 14 4 Z"
              fill="url(#miniDiyaFlame)"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (season === "christmas") {
    return (
      <div
        className="pointer-events-none absolute -top-2 -right-2 z-20 overflow-visible"
        aria-hidden="true"
      >
        {/* 3D Faceted Starlight Ornament with Specular Glint */}
        <div className="star-twinkling relative flex items-center justify-center">
          <svg
            viewBox="0 0 28 28"
            className="w-5 h-5 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]"
          >
            <defs>
              <linearGradient id="facetGold1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="60%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="facetGold2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="60%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
            </defs>

            {/* Faceted 8-Pointed Cosmic Star */}
            <polygon points="14,2 17,10 26,14 17,18 14,26 11,18 2,14 11,10" fill="url(#facetGold1)" />
            <polygon points="14,2 14,14 26,14" fill="url(#facetGold2)" opacity="0.75" />
            <polygon points="14,14 14,26 2,14" fill="url(#facetGold2)" opacity="0.65" />
            <circle cx="14" cy="14" r="2.5" fill="#FFFFFF" className="drop-shadow-[0_0_4px_#FFFFFF]" />
          </svg>
        </div>
      </div>
    );
  }

  return null;
}
