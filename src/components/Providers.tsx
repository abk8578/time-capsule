"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionConfig } from "motion/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="always">
        <SessionProvider>{children}</SessionProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
