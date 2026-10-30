"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSeasonalTheme } from "./SeasonalThemeContext";
import HalloweenEffects from "./HalloweenEffects";
import DiwaliEffects from "./DiwaliEffects";
import ChristmasEffects from "./ChristmasEffects";
import type { SeasonalThemeType, ThemeIntensity } from "@/types";

interface SeasonalThemeOverlayProps {
  overrideTheme?: SeasonalThemeType;
  overrideIntensity?: ThemeIntensity;
}

export default function SeasonalThemeOverlay({
  overrideTheme,
  overrideIntensity,
}: SeasonalThemeOverlayProps) {
  const pathname = usePathname();
  const { activeTheme, intensity } = useSeasonalTheme();

  // Seasonal effects are strictly for user / public pages, NEVER on the admin panel
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const theme = overrideTheme || activeTheme;
  const effIntensity = overrideIntensity || intensity;

  if (theme === "default") {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {theme === "halloween" && <HalloweenEffects intensity={effIntensity} />}
      {theme === "diwali" && <DiwaliEffects intensity={effIntensity} />}
      {theme === "christmas" && <ChristmasEffects intensity={effIntensity} />}
    </div>
  );
}

