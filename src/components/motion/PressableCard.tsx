"use client";

import { motion } from "motion/react";
import React from "react";

interface PressableCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverLift?: boolean;
}

export default function PressableCard({
  children,
  className = "",
  onClick,
  hoverLift = true,
}: PressableCardProps) {
  return (
    <motion.div
      whileHover={hoverLift ? { y: -4, transition: { duration: 0.2, ease: "easeOut" } } : undefined}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      onClick={onClick}
      className={`transition-colors duration-200 cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
}
