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

function applyThemeToDocument(targetTheme: Theme) {
  if (typeof window === "undefined") return;
  if (targetTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

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

  // 1. Initial mount & load from Database user settings
  useEffect(() => {
    // Apply immediate local preference first
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("theme") as Theme | null;
        if (saved === "light" || saved === "dark") {
          setThemeState(saved);
          applyThemeToDocument(saved);
        } else {
          applyThemeToDocument("dark");
        }
      }
    } catch {
      applyThemeToDocument("dark");
    }

    // 2. Query MongoDB database for user/admin settings
    let isMounted = true;
    fetch("/api/user/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.settings?.theme) return;
        const dbTheme = data.settings.theme as Theme;
        if (dbTheme === "light" || dbTheme === "dark") {
          setThemeState(dbTheme);
          applyThemeToDocument(dbTheme);
          try {
            sessionStorage.setItem("theme", dbTheme);
            document.cookie = `theme=${dbTheme}; path=/; max-age=31536000; SameSite=Lax`;
          } catch {
            // safe
          }
        }
      })
      .catch(() => {
        // Non-fatal if unauthenticated
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. User or admin clicks toggle: Update state, DOM, cookie, and save directly to MongoDB!
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);

    // Save to storage & cookie
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("theme", newTheme);
        document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // safe
    }

    // Save to MongoDB database via API
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: newTheme }),
    }).catch(() => {
      // Non-fatal if offline or unauthenticated
    });
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
