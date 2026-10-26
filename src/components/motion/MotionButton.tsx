"use client";

import { motion, HTMLMotionProps } from "motion/react";
import React from "react";

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  enableHaptic?: boolean;
}

export default function MotionButton({
  children,
  onClick,
  className = "",
  enableHaptic = true,
  ...props
}: MotionButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableHaptic) {
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(10);
        }
      } catch {
        // Ignore vibration errors
      }
    }
    onClick?.(e);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={handleClick}
      className={`min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
