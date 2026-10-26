"use client";

import React from "react";

export default function LandingGsapProvider({ children }: { children: React.ReactNode }) {
  // Simple native scrolling without Lenis momentum hijacking or scroll triggers
  return <div className="w-full relative">{children}</div>;
}
