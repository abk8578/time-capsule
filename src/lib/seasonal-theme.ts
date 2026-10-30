import type { SeasonType, ThemeIntensity, SeasonDTO } from "@/types";

export const ALLOWED_SEASONS: readonly SeasonType[] = [
  "default",
  "halloween",
  "diwali",
  "christmas",
] as const;

export const SEASON_DATE_RANGES = {
  halloween: {
    name: "Halloween",
    description: "Oct 25 to Nov 1 (inclusive)",
  },
  diwali: {
    name: "Diwali",
    description: "Nov 2 to Nov 15 (inclusive)",
  },
  christmas: {
    name: "Christmas",
    description: "Dec 15 to Dec 26 (inclusive)",
  },
  default: {
    name: "Default",
    description: "Standard website appearance",
  },
} as const;

/**
 * Computes seasonal theme based purely on date.
 * - Halloween: Oct 25 to Nov 1 (inclusive)
 * - Diwali: Nov 2 to Nov 15 (inclusive)
 * - Christmas: Dec 15 to Dec 26 (inclusive)
 * - Otherwise: Default
 *
 * @param dateInput Optional date to check (defaults to current date)
 */
export function getSeasonByDate(
  dateInput: Date | string | number = new Date()
): SeasonType {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    return "default";
  }

  // Month is 0-indexed in JavaScript Date:
  // 0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec
  const month = d.getMonth();
  const day = d.getDate();

  // Halloween: Oct 25 to Nov 1 (inclusive)
  if ((month === 9 && day >= 25) || (month === 10 && day <= 1)) {
    return "halloween";
  }

  // Diwali: Nov 2 to Nov 15 (inclusive)
  if (month === 10 && day >= 2 && day <= 15) {
    return "diwali";
  }

  // Christmas: Dec 15 to Dec 26 (inclusive)
  if (month === 11 && day >= 15 && day <= 26) {
    return "christmas";
  }

  return "default";
}

// Backward-compatible alias
export const getSeasonalThemeByDate = getSeasonByDate;

/**
 * Normalizes and clamps intensity level between 1 and 3.
 */
export function clampIntensity(val: unknown): ThemeIntensity {
  const num = typeof val === "number" ? val : Number(val);
  if (num === 1 || num === 2 || num === 3) {
    return num;
  }
  if (!Number.isNaN(num)) {
    const rounded = Math.round(num);
    if (rounded <= 1) return 1;
    if (rounded >= 3) return 3;
    return 2;
  }
  return 2;
}

/**
 * Validates whether a string is a recognized season.
 */
export function isValidSeason(season: unknown): season is SeasonType {
  return typeof season === "string" && ALLOWED_SEASONS.includes(season as SeasonType);
}

export const isValidSeasonalTheme = isValidSeason;

/**
 * Resolves active season given the stored settings and an optional reference date.
 * When auto is true, activeSeason is determined by date.
 * When auto is false, activeSeason uses the manually configured season.
 */
export function resolveSeason(
  settings: {
    auto?: boolean | null;
    season?: string | null;
    theme?: string | null;
    intensity?: number | null;
  } | null | undefined,
  dateInput: Date | string | number = new Date()
): SeasonDTO {
  const auto = settings?.auto !== false; // Default ON (true)
  const rawSeason = settings?.season || settings?.theme;
  const season: SeasonType = isValidSeason(rawSeason) ? rawSeason : "default";
  const intensity = clampIntensity(settings?.intensity);

  const activeSeason: SeasonType = auto
    ? getSeasonByDate(dateInput)
    : season;

  return {
    auto,
    season,
    activeSeason,
    intensity,
    // Aliases for compatibility
    theme: season,
    activeTheme: activeSeason,
  };
}

export const resolveSeasonalTheme = resolveSeason;
export const ALLOWED_SEASONAL_THEMES = ALLOWED_SEASONS;
export const THEME_DATE_RANGES = SEASON_DATE_RANGES;
