import crypto from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { hasRedisEnv } from '@/lib/redis-cards';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

let hourlyLimiter: Ratelimit | null = null;
let dailyLimiter: Ratelimit | null = null;

function getLimiters(): { hourly: Ratelimit; daily: Ratelimit } | null {
  if (!hasRedisEnv()) return null;

  if (!hourlyLimiter || !dailyLimiter) {
    const redis = Redis.fromEnv();
    hourlyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'ratelimit:submissions:1h',
      analytics: false,
    });
    dailyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, '24 h'),
      prefix: 'ratelimit:submissions:24h',
      analytics: false,
    });
  }

  return { hourly: hourlyLimiter, daily: dailyLimiter };
}

/**
 * Extracts best-effort client IP from Vercel / reverse-proxy headers.
 */
export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

/**
 * Hashes client IP with a server-side salt so raw IPs are never stored in Postgres.
 */
export function hashClientIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.AUTH_SECRET || 'chocobo-dev-salt';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

/**
 * Enforces sliding-window submission rate limits (5/hour and 15/day per hashed IP).
 */
export async function checkSubmissionRateLimit(ipHash: string): Promise<RateLimitResult> {
  const limiters = getLimiters();
  if (!limiters) {
    // Allow locally when Upstash Redis isn't configured
    return { allowed: true, remaining: 5, resetAt: Date.now() + 3600_000 };
  }

  const [hourly, daily] = await Promise.all([
    limiters.hourly.limit(ipHash),
    limiters.daily.limit(ipHash),
  ]);

  if (!hourly.success) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: hourly.reset,
      reason: 'Hourly submission limit reached (max 5 per hour). Please try again later.',
    };
  }

  if (!daily.success) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: daily.reset,
      reason: 'Daily submission limit reached (max 15 per 24 hours). Please try again tomorrow.',
    };
  }

  return {
    allowed: true,
    remaining: Math.min(hourly.remaining, daily.remaining),
    resetAt: Math.min(hourly.reset, daily.reset),
  };
}
