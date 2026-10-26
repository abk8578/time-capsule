"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Clean hydration mount check without cascading render warnings
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="h-11 w-11 rounded-xl border border-border bg-card/60" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      id="theme-toggle"
      type="button"
      whileTap={{ scale: 0.93 }}
      whileHover={{ y: -1.5 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-text shadow-xs transition-colors hover:bg-border/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Sun className="h-4.5 w-4.5 text-accent" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: 70, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -70, scale: 0.6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Moon className="h-4.5 w-4.5 text-muted" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
