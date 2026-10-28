/**
 * Server-side Environment Configuration & Production Validation
 *
 * Rules:
 * - Do NOT throw during build time (`npm run build`, `next build`, or NEXT_PHASE=phase-production-build).
 * - URL missing ho toh throw mat karo (sirf console.warn).
 * - Throw sirf tab jab value me localhost ya 127.0.0.1 ho aur production runtime ho.
 */
export function validateEnvironment(): void {
  // Never throw during build phase
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.argv.includes("build")
  ) {
    return;
  }

  // Check runtime only: VERCEL_ENV=production or NODE_ENV=production during server run
  const isVercelProd = process.env.VERCEL_ENV === "production";
  const isProdStart =
    process.env.NODE_ENV === "production" &&
    (process.argv.includes("start") || !process.argv.includes("dev"));

  if (isVercelProd || isProdStart) {
    const rawUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      "";

    // If URL is missing, warn only - do NOT throw
    if (!rawUrl) {
      console.warn(
        "[WARN] Neither APP_URL nor NEXTAUTH_URL is defined in production runtime. Please set your canonical domain."
      );
      return;
    }

    // Throw ONLY when value contains localhost or loopback in production runtime
    if (
      rawUrl.includes("localhost") ||
      rawUrl.includes("127.0.0.1") ||
      rawUrl.startsWith("http://0.0.0.0")
    ) {
      throw new Error(
        `[FATAL CONFIG ERROR] Invalid production URL configuration: APP_URL/NEXTAUTH_URL cannot be localhost or loopback in production mode. Configured: "${rawUrl}". Please set a valid production domain (e.g. https://yourdomain.com).`
      );
    }
  }
}

/**
 * Helper to safely resolve the canonical application URL in all environments
 * (Local dev, Vercel preview, and production).
 */
export function getAppUrl(): string {
  const url =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

// Automatically validate on module import in server runtime
validateEnvironment();
