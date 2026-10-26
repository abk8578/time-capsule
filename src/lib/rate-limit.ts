/**
 * In-memory sliding-window rate limiter.
 * NOTE: This is an in-memory sliding-window rate limiter suitable for development
 * and single-process Node.js environments.
 * TODO: In multi-instance serverless production environments (e.g. Vercel, AWS Lambda, Kubernetes),
 * replace this store with distributed state using Redis or Upstash (@upstash/ratelimit)
 * so counters are shared across all edge/serverless nodes.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale keys (every 5 minutes)
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref timer so it does not block process exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Extracts client IP from incoming HTTP headers (takes first x-forwarded-for entry, fallback to 127.0.0.1).
 */
export function getClientIp(
  headers: Headers | { get: (name: string) => string | null } | Record<string, string | string[] | undefined> | null | undefined
): string {
  if (!headers) return "127.0.0.1";

  let forwarded: string | null | undefined = null;

  if (typeof (headers as { get: (name: string) => string | null }).get === "function") {
    forwarded = (headers as { get: (name: string) => string | null }).get("x-forwarded-for");
  } else if ("x-forwarded-for" in headers) {
    const raw = (headers as Record<string, string | string[] | undefined>)["x-forwarded-for"];
    forwarded = Array.isArray(raw) ? raw[0] : raw;
  }

  if (forwarded && typeof forwarded === "string") {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "127.0.0.1";
}

/**
 * Checks whether a given key has exceeded the maximum allowed requests in a rolling window.
 *
 * @param key Unique identifier (e.g. `upload_url:${userId}`)
 * @param limit Maximum allowed requests within the window (default: 30)
 * @param windowMs Duration of the sliding window in milliseconds (default: 10 minutes)
 */
export function checkRateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 10 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { timestamps: [] };

  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, oldest + windowMs - now);
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  rateLimitStore.set(key, record);

  return {
    success: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}
