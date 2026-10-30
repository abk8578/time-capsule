"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SeasonalThemeProvider } from "@/components/seasonal/SeasonalThemeContext";
import SeasonalThemeOverlay from "@/components/seasonal/SeasonalThemeOverlay";
import { MotionConfig } from "motion/react";

interface ProvidersProps {
  children: React.ReactNode;
  initialTheme?: "dark" | "light";
}

export default function Providers({
  children,
  initialTheme = "dark",
}: ProvidersProps) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <SeasonalThemeProvider>
        {/* Seasonal overlay layer: fixed, pointer-events none, overflow hidden, high z-index */}
        <SeasonalThemeOverlay />
        <MotionConfig reducedMotion="always">
          <SessionProvider>{children}</SessionProvider>
        </MotionConfig>
      </SeasonalThemeProvider>
    </ThemeProvider>
  );
}
