"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { useIsMounted } from "@/hooks/useIsMounted";

interface CountdownTimerProps {
  unlockAt: string;
  compact?: boolean;
}

interface TimeRemaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(unlockAtIso: string): TimeRemaining {
  const target = new Date(unlockAtIso).getTime();
  const now = Date.now();
  const total = target - now;

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

export default function CountdownTimer({
  unlockAt,
  compact = false,
}: CountdownTimerProps) {
  const isMounted = useIsMounted();
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(unlockAt));

  useEffect(() => {
    // Ticking interval running inside timer callback (no synchronous setState in effect)
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(unlockAt);
      setTime(remaining);
      if (remaining.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockAt]);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-muted">
        <Clock className="h-3.5 w-3.5 animate-spin text-amber-400" />
        <span>Aligning coordinates...</span>
      </div>
    );
  }

  if (time.total <= 0) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-mono font-semibold text-amber-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Star Unsealed</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>
          {time.days > 0 && `${time.days}d `}
          {String(time.hours).padStart(2, "0")}h{" "}
          {String(time.minutes).padStart(2, "0")}m{" "}
          {String(time.seconds).padStart(2, "0")}s
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 text-center">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md px-3.5 py-2.5 min-w-[62px] sm:min-w-[72px] shadow-sm">
        <span className="font-mono text-xl sm:text-2xl font-light text-text">
          {time.days}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">
          Days
        </span>
      </div>
      <span className="font-mono text-amber-400/80 text-lg">:</span>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md px-3.5 py-2.5 min-w-[62px] sm:min-w-[72px] shadow-sm">
        <span className="font-mono text-xl sm:text-2xl font-light text-text">
          {String(time.hours).padStart(2, "0")}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">
          Hours
        </span>
      </div>
      <span className="font-mono text-amber-400/80 text-lg">:</span>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md px-3.5 py-2.5 min-w-[62px] sm:min-w-[72px] shadow-sm">
        <span className="font-mono text-xl sm:text-2xl font-light text-text">
          {String(time.minutes).padStart(2, "0")}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">
          Mins
        </span>
      </div>
      <span className="font-mono text-amber-400/80 text-lg">:</span>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 backdrop-blur-md px-3.5 py-2.5 min-w-[62px] sm:min-w-[72px] shadow-sm star-glow-amber">
        <span className="font-mono text-xl sm:text-2xl font-light text-amber-400">
          {String(time.seconds).padStart(2, "0")}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-400/80 font-semibold">
          Secs
        </span>
      </div>
    </div>
  );
}
