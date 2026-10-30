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
    document.documentElement.setAttribute("data-mode", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-mode", "light");
  }
}

function getSavedTheme(fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  try {
    const local = localStorage.getItem("theme");
    if (local === "light" || local === "dark") return local;
    const session = sessionStorage.getItem("theme");
    if (session === "light" || session === "dark") return session;
    const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
    if (match) {
      const val = decodeURIComponent(match[1]);
      if (val === "light" || val === "dark") return val;
    }
  } catch {
    // safe fallback
  }
  return fallback;
}

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => getSavedTheme(initialTheme));

  // 1. Initial mount & load from Database user settings
  useEffect(() => {
    // Apply immediate local preference first
    const activeTheme = getSavedTheme(initialTheme);
    setThemeState(activeTheme);
    applyThemeToDocument(activeTheme);

    // 2. Query MongoDB database for user/admin settings in background
    let isMounted = true;
    fetch("/api/user/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.settings?.theme) return;
        const dbTheme = data.settings.theme as Theme;
        if (dbTheme === "light" || dbTheme === "dark") {
          try {
            localStorage.setItem("theme", dbTheme);
            sessionStorage.setItem("theme", dbTheme);
            document.cookie = `theme=${dbTheme}; path=/; max-age=31536000; SameSite=Lax`;
          } catch {
            // safe
          }
          setThemeState(dbTheme);
          applyThemeToDocument(dbTheme);
        }
      })
      .catch(() => {
        // Non-fatal if unauthenticated
      });

    return () => {
      isMounted = false;
    };
  }, [initialTheme]);

  // 3. User or admin clicks toggle: Update state, DOM, cookie, localStorage, and save directly to MongoDB!
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);

    // Save to localStorage, sessionStorage & cookie
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
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
