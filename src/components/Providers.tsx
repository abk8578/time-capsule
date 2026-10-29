"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
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
      <MotionConfig reducedMotion="always">
        <SessionProvider>{children}</SessionProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
