"use client";

import React, { useRef, useEffect } from "react";

export interface NightSkyCanvasProps {
  pointerPos?: { x: number; y: number };
  scrollProgress?: number;
  className?: string;
}

export default function NightSkyCanvas({
  className = "",
}: NightSkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Peaceful stellar colors
    const starColors = [
      "rgba(255, 255, 255,",   // Diamond White
      "rgba(186, 230, 253,",   // Cool Cyan-White
      "rgba(253, 230, 138,",   // Warm Amber-Gold
      "rgba(224, 231, 255,",   // Cosmic Lavender
    ];

    const drawStaticStarfield = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Deep space background
      ctx.fillStyle = "#03060E";
      ctx.fillRect(0, 0, width, height);

      // Subtle celestial nebula glow
      const auraGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.15,
        20,
        width * 0.5,
        height * 0.2,
        width * 0.6
      );
      auraGrad.addColorStop(0, "rgba(245, 158, 11, 0.035)");
      auraGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.015)");
      auraGrad.addColorStop(1, "rgba(3, 6, 14, 0)");
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw 350 static stars
      const starCount = 350;
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5 + 0.5;
        const alpha = Math.random() * 0.55 + 0.25;

        const rand = Math.random();
        const color =
          rand > 0.8
            ? starColors[2]
            : rand > 0.55
            ? starColors[1]
            : rand > 0.40
            ? starColors[3]
            : starColors[0];

        ctx.fillStyle = `${color} ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Soft halo on occasional bright star
        if (size > 1.6 && alpha > 0.5) {
          ctx.fillStyle = `${color} ${alpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    drawStaticStarfield();
    window.addEventListener("resize", drawStaticStarfield);

    return () => {
      window.removeEventListener("resize", drawStaticStarfield);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`hidden dark:block fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[#03060E] ${className}`}
      aria-hidden="true"
    />
  );
}
