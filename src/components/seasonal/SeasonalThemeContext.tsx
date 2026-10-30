"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import type { SeasonType, ThemeIntensity, SeasonDTO } from "@/types";
import { resolveSeason } from "@/lib/seasonal-theme";

interface SeasonalThemeContextType {
  activeSeason: SeasonType;
  auto: boolean;
  season: SeasonType;
  intensity: ThemeIntensity;
  isLoading: boolean;
  refreshSeason: () => Promise<void>;
  applySeasonToDom: (season: SeasonType) => void;
  // Aliases
  activeTheme: SeasonType;
  theme: SeasonType;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType>({
  activeSeason: "default",
  auto: true,
  season: "default",
  intensity: 2,
  isLoading: true,
  refreshSeason: async () => {},
  applySeasonToDom: () => {},
  activeTheme: "default",
  theme: "default",
});

export const SEASONAL_THEME_EVENT = "timecapsule:seasonal-theme-updated";

/**
 * Sets data-season on the root <html> element.
 * Never touches or mutates data-mode or the .dark class.
 * Ensures the admin panel (/admin) always remains on "default" season.
 */
function applySeasonAttribute(target: SeasonType) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) {
    document.documentElement.setAttribute("data-season", "default");
    return;
  }
  const cleanSeason = target === "halloween" || target === "christmas" ? target : "default";
  document.documentElement.setAttribute("data-season", cleanSeason);
}

export function SeasonalThemeProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<SeasonDTO>;
}) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SeasonDTO>(() => {
    let cachedSeason: SeasonType = "default";
    if (typeof window !== "undefined") {
      try {
        const val = sessionStorage.getItem("active_season") as SeasonType;
        if (val === "halloween" || val === "christmas" || val === "default") {
          cachedSeason = val;
        }
      } catch {
        // Safe fallback
      }
    }
    return resolveSeason(initialSettings || { season: cachedSeason, auto: true, intensity: 2 });
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync data-season on document: reset to "default" on /admin routes, apply seasonal theme on public routes
  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      document.documentElement.setAttribute("data-season", "default");
    } else {
      applySeasonAttribute(settings.activeSeason);
    }
  }, [pathname, settings.activeSeason]);

  const fetchSeasonSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/theme", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const resolved = resolveSeason(data);
        setSettings(resolved);
        applySeasonAttribute(resolved.activeSeason);
        try {
          sessionStorage.setItem("active_season", resolved.activeSeason);
        } catch {
          // safe
        }
      }
    } catch (err) {
      console.warn("[SeasonalThemeProvider] Failed to fetch season settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    applySeasonAttribute(settings.activeSeason);

    const loadInitial = async () => {
      try {
        const res = await fetch("/api/theme", { cache: "no-store" });
        if (res.ok && isMounted) {
          const data = await res.json();
          const resolved = resolveSeason(data);
          setSettings(resolved);
          applySeasonAttribute(resolved.activeSeason);
          try {
            sessionStorage.setItem("active_season", resolved.activeSeason);
          } catch {
            // safe
          }
        }
      } catch (err) {
        console.warn("[SeasonalThemeProvider] Initial fetch notice:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    const handleSeasonUpdate = () => {
      fetchSeasonSettings();
    };

    window.addEventListener(SEASONAL_THEME_EVENT, handleSeasonUpdate);
    window.addEventListener("storage", handleSeasonUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(SEASONAL_THEME_EVENT, handleSeasonUpdate);
      window.removeEventListener("storage", handleSeasonUpdate);
    };
  }, [fetchSeasonSettings, settings.activeSeason]);

  return (
    <SeasonalThemeContext.Provider
      value={{
        activeSeason: settings.activeSeason,
        auto: settings.auto,
        season: settings.season,
        intensity: settings.intensity,
        isLoading,
        refreshSeason: fetchSeasonSettings,
        applySeasonToDom: applySeasonAttribute,
        activeTheme: settings.activeSeason,
        theme: settings.season,
      }}
    >
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export function useSeasonalTheme() {
  return useContext(SeasonalThemeContext);
}
