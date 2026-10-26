"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "motion/react";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth springs for cursor trailing
  const cursorX = useSpring(0, { damping: 28, stiffness: 350 });
  const cursorY = useSpring(0, { damping: 28, stiffness: 350 });
  const haloX = useSpring(0, { damping: 20, stiffness: 180 });
  const haloY = useSpring(0, { damping: 20, stiffness: 180 });

  useEffect(() => {
    // Only enable on fine pointer (mouse/trackpad), never on touch screens
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      haloX.set(e.clientX);
      haloY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInteractive = !!target.closest(
        "a, button, input, textarea, select, [role='button'], [data-cursor-interactive]"
      );
      setIsHovered(isInteractive);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cursorX, cursorY, haloX, haloY, visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer Starlight Aura Halo */}
      <motion.div
        style={{
          x: haloX,
          y: haloY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 1.8 : 1,
          opacity: isHovered ? 0.75 : 0.35,
        }}
        transition={{ duration: 0.2 }}
        className="absolute h-9 w-9 rounded-full border border-amber-400/60 bg-amber-400/10 blur-[1px] shadow-[0_0_20px_rgba(245,158,11,0.25)]"
      />

      {/* Center Star Core Orb */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 1.4 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="absolute h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#F59E0B,0_0_4px_#FFF]"
      />
    </div>
  );
}
