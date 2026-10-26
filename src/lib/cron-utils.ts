import crypto from "crypto";

/**
 * Hashes a raw token with SHA-256 for secure database storage and lookup.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Checks whether an access token has expired relative to a given timestamp.
 */
export function isTokenExpired(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  const n = new Date(now).getTime();
  return exp < n;
}

/**
 * Determines whether a capsule qualifies for a 24-hour advance reminder.
 *
 * Rules:
 * - unlockAt must be in the next 24 hours: now < unlockAt <= now + 24 hours
 * - Total capsule lifespan must be strictly greater than 48 hours: unlockAt - createdAt > 48 hours
 */
export function shouldSendReminder(
  createdAt: Date | string,
  unlockAt: Date | string,
  now: Date = new Date()
): boolean {
  const createdTime = new Date(createdAt).getTime();
  const unlockTime = new Date(unlockAt).getTime();
  const nowTime = new Date(now).getTime();
  const twentyFourHoursFromNow = nowTime + 24 * 60 * 60 * 1000;

  // 1. Must be within the upcoming 24-hour advance reminder window
  if (unlockTime <= nowTime || unlockTime > twentyFourHoursFromNow) {
    return false;
  }

  // 2. Lifespan rule: only send reminder if total duration > 48 hours
  if (unlockTime - createdTime <= 48 * 60 * 60 * 1000) {
    return false;
  }

  return true;
}
