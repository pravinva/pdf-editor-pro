/**
 * Rate Limiting Library
 *
 * Implements token bucket rate limiting with:
 * - IP-based throttling (60 req/min default)
 * - In-memory storage (Map)
 * - Automatic cleanup of old entries
 * - Per-endpoint rate limits
 * - Sliding window algorithm
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
}

interface RequestLog {
  timestamps: number[];
  blocked: boolean;
  blockUntil?: number;
}

/**
 * In-memory rate limit store
 * In production, replace with Redis or similar distributed cache
 */
class RateLimitStore {
  private store: Map<string, RequestLog>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Start automatic cleanup of old entries
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up old entries (older than 1 hour)
   */
  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [key, log] of this.store.entries()) {
      // Remove if all timestamps are old and not currently blocked
      const hasRecentRequests = log.timestamps.some(t => t > oneHourAgo);
      const isBlocked = log.blocked && log.blockUntil && log.blockUntil > now;

      if (!hasRecentRequests && !isBlocked) {
        this.store.delete(key);
      }
    }

    console.log(`Rate limit cleanup: ${this.store.size} entries remaining`);
  }

  /**
   * Get request log for a key
   */
  get(key: string): RequestLog | undefined {
    return this.store.get(key);
  }

  /**
   * Set request log for a key
   */
  set(key: string, log: RequestLog): void {
    this.store.set(key, log);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get store size
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global store instance
const store = new RateLimitStore();

/**
 * Default rate limit configurations
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  global: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again later.'
  },
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many upload requests. Please wait before uploading again.'
  },
  ocr: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many OCR requests. Please wait before processing more documents.'
  },
  api: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'API rate limit exceeded. Please slow down your requests.'
  }
};

/**
 * Check rate limit for a client
 *
 * @param identifier - Client identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS.global
): RateLimitResult {
  const now = Date.now();
  const { maxRequests, windowMs, message } = config;

  // Get or create request log
  let log = store.get(identifier);
  if (!log) {
    log = {
      timestamps: [],
      blocked: false
    };
  }

  // Check if currently blocked
  if (log.blocked && log.blockUntil && log.blockUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: log.blockUntil,
      message: message || 'Rate limit exceeded. Please try again later.'
    };
  }

  // Remove timestamps outside the window
  log.timestamps = log.timestamps.filter(t => now - t < windowMs);

  // Check if limit exceeded
  if (log.timestamps.length >= maxRequests) {
    // Block for the remaining window time
    const oldestTimestamp = log.timestamps[0];
    const blockUntil = oldestTimestamp + windowMs;

    log.blocked = true;
    log.blockUntil = blockUntil;
    store.set(identifier, log);

    return {
      allowed: false,
      remaining: 0,
      resetAt: blockUntil,
      message: message || 'Rate limit exceeded. Please try again later.'
    };
  }

  // Add current timestamp
  log.timestamps.push(now);
  log.blocked = false;
  store.set(identifier, log);

  // Calculate remaining requests
  const remaining = maxRequests - log.timestamps.length;

  // Calculate reset time (when oldest request expires)
  const oldestTimestamp = log.timestamps[0];
  const resetAt = oldestTimestamp + windowMs;

  return {
    allowed: true,
    remaining,
    resetAt
  };
}

/**
 * Check rate limit with multiple limits
 * All limits must pass for request to be allowed
 *
 * @param identifier - Client identifier
 * @param configs - Array of rate limit configurations
 * @returns Rate limit result (first failed check)
 */
export function checkMultipleRateLimits(
  identifier: string,
  configs: RateLimitConfig[]
): RateLimitResult {
  for (const config of configs) {
    const result = checkRateLimit(identifier, config);
    if (!result.allowed) {
      return result;
    }
  }

  // All checks passed
  return {
    allowed: true,
    remaining: -1, // Don't know which limit is most restrictive
    resetAt: Date.now()
  };
}

/**
 * Create rate limit key for endpoint
 *
 * @param identifier - Client identifier
 * @param endpoint - API endpoint
 * @returns Rate limit key
 */
export function createRateLimitKey(identifier: string, endpoint: string): string {
  return `${identifier}:${endpoint}`;
}

/**
 * Reset rate limit for identifier
 *
 * @param identifier - Client identifier
 */
export function resetRateLimit(identifier: string): void {
  store.set(identifier, {
    timestamps: [],
    blocked: false
  });
}

/**
 * Get current rate limit status
 *
 * @param identifier - Client identifier
 * @param config - Rate limit configuration
 * @returns Current status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS.global
): { current: number; max: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const { maxRequests, windowMs } = config;

  const log = store.get(identifier);
  if (!log) {
    return {
      current: 0,
      max: maxRequests,
      remaining: maxRequests,
      resetAt: now + windowMs
    };
  }

  // Filter recent requests
  const recentRequests = log.timestamps.filter(t => now - t < windowMs);
  const remaining = Math.max(0, maxRequests - recentRequests.length);

  // Calculate reset time
  const oldestTimestamp = recentRequests[0] || now;
  const resetAt = oldestTimestamp + windowMs;

  return {
    current: recentRequests.length,
    max: maxRequests,
    remaining,
    resetAt
  };
}

/**
 * Express-style middleware for rate limiting
 * Can be used in Next.js API routes
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function rateLimitMiddleware(config: RateLimitConfig = DEFAULT_RATE_LIMITS.global) {
  return (identifier: string): RateLimitResult => {
    return checkRateLimit(identifier, config);
  };
}

/**
 * Clear all rate limit data
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  store.clear();
}

/**
 * Get store statistics
 */
export function getRateLimitStats(): {
  totalKeys: number;
  blockedCount: number;
} {
  let blockedCount = 0;
  const now = Date.now();

  for (const log of store.get.length ? Array.from(store.get.toString()) : []) {
    if (log && typeof log === 'object' && 'blocked' in log) {
      const typedLog = log as RequestLog;
      if (typedLog.blocked && typedLog.blockUntil && typedLog.blockUntil > now) {
        blockedCount++;
      }
    }
  }

  return {
    totalKeys: store.size,
    blockedCount
  };
}

/**
 * Clean up rate limiter on process exit
 */
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    store.destroy();
  });
}

// Export store for testing
export { store as _store };
