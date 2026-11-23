import { describe, expect, it, vi } from 'vitest';
import { shouldBypassMiddleware } from '@/lib/routing';

vi.mock('@/db', () => ({
  hasDatabaseEnv: vi.fn(() => false),
  getDb: vi.fn(),
}));

vi.mock('@/lib/redis-cards', () => ({
  hasRedisEnv: vi.fn(() => false),
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health & trust route middleware bypass', () => {
  it('returns 200 ok JSON with no-store cache header when running in fallback mode', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    const body = (await res.json()) as { status: string; store: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(body.store).toBe('fallback');
    expect(typeof body.timestamp).toBe('string');
  });

  it('bypasses custom domain rewriting for /privacy and /methodology', () => {
    expect(shouldBypassMiddleware('/privacy')).toBe(true);
    expect(shouldBypassMiddleware('/methodology')).toBe(true);
    expect(shouldBypassMiddleware('/api/health')).toBe(true);
  });
});
