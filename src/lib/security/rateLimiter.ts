/**
 * src/lib/security/rateLimiter.ts
 *
 * In-memory sliding window rate limiter for protecting endpoints
 * (login, forgot-password, applications, contact forms).
 */

type HitRecord = {
  timestamps: number[];
  blockedUntil?: number;
};

const store = new Map<string, HitRecord>();

// Cleanup expired entries periodically
const CLEANUP_INTERVAL_MS = 60_000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    // Keep if blocked or if has any timestamp in last hour
    if (record.blockedUntil && record.blockedUntil > now) continue;
    const recent = record.timestamps.filter((t) => now - t < 3600_000);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      record.timestamps = recent;
    }
  }
}, CLEANUP_INTERVAL_MS);

if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
  cleanupTimer.unref();
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const xReal = request.headers.get('x-real-ip');
  if (xReal) return xReal.trim();
  const xForwarded = request.headers.get('x-forwarded-for');
  if (xForwarded) return xForwarded.split(',')[0].trim();
  return '127.0.0.1';
}

export type RateLimitConfig = {
  /** Maximum number of hits allowed in the window */
  max: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** If set, block for this many seconds when max is exceeded */
  blockSeconds?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Checks and records a hit against a rate limit bucket.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const blockMs = (config.blockSeconds ?? config.windowSeconds) * 1000;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= config.max) {
    record.blockedUntil = now + blockMs;
    const retryAfterSeconds = Math.ceil(blockMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, config.max - record.timestamps.length);

  return {
    allowed: true,
    remaining,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets/clears the rate limit counter for a specific key (e.g. upon successful login).
 */
export function resetRateLimit(key: string) {
  store.delete(key);
}
