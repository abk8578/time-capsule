"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("theme");
        if (saved === "light" || saved === "dark") {
          return saved as Theme;
        }
      } catch {
        // Safe fallback
      }
    }
    return "dark";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("theme") as Theme | null;
        if (saved === "light" || saved === "dark") {
          setThemeState(saved);
          if (saved === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // Default to dark mode for the cosmic theme
          document.documentElement.classList.add("dark");
        }
      }
    } catch {
      // Safe fallback if sessionStorage is unavailable
      document.documentElement.classList.add("dark");
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // Ignore sessionStorage errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
