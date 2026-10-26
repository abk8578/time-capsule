"use client";

import { useIsMounted } from "@/hooks/useIsMounted";

interface LocalDateTextProps {
  dateString: string;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
  className?: string;
}

/**
 * Renders an ISO date string formatted into the user's browser local timezone.
 * Uses useSyncExternalStore via useIsMounted to prevent hydration mismatch
 * without setTimeout(0) workarounds or cascading renders.
 */
export default function LocalDateText({
  dateString,
  options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  fallback = "Loading date...",
  className = "",
}: LocalDateTextProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <span className={`opacity-60 ${className}`}>{fallback}</span>;
  }

  let formatted = fallback;
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      formatted = d.toLocaleString(undefined, options);
    }
  } catch {
    formatted = dateString;
  }

  return <span className={className}>{formatted}</span>;
}
