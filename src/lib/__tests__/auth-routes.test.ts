import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAllowlistedAdmin } from '@/lib/admin-allowlist';

const { mockRequireAdmin } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

import { POST as addPriceHistoryPost } from '@/app/api/add-price-history/route';
import { POST as submitPost } from '@/app/api/submit/route';
import { POST as updateGradingPost } from '@/app/api/update-grading/route';
import { POST as updateImagePost } from '@/app/api/update-image/route';
import { POST as updatePricePost } from '@/app/api/update-price/route';

describe('admin allowlist logic', () => {
  beforeEach(() => {
    delete process.env.ADMIN_GITHUB_IDS;
    delete process.env.ADMIN_GITHUB_LOGINS;
  });

  it('fails closed when no allowlist env vars are configured', () => {
    expect(isAllowlistedAdmin({ githubId: '12345', githubLogin: 'tafokints' })).toBe(false);
  });

  it('matches allowlisted GitHub logins case-insensitively and numeric IDs', () => {
    process.env.ADMIN_GITHUB_LOGINS = 'tafokints, co-admin';
    process.env.ADMIN_GITHUB_IDS = '20830853';

    expect(isAllowlistedAdmin({ githubLogin: 'Tafokints' })).toBe(true);
    expect(isAllowlistedAdmin({ githubId: '20830853' })).toBe(true);
    expect(isAllowlistedAdmin({ githubId: '99999', githubLogin: 'intruder' })).toBe(false);
  });
});

describe('write API route authentication guards', () => {
  const routes: Array<[string, (req: NextRequest) => Promise<Response>]> = [
    ['/api/submit', (req) => submitPost(req)],
    ['/api/update-price', (req) => updatePricePost(req)],
    ['/api/update-image', (req) => updateImagePost(req)],
    ['/api/update-grading', (req) => updateGradingPost(req)],
    ['/api/add-price-history', (req) => addPriceHistoryPost(req)],
  ];

  it.each(routes)('returns 401 for unauthenticated POST to %s', async (path, handler) => {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    });

    const req = new NextRequest(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 1 }),
    });

    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it.each(routes)('returns 403 for non-admin authenticated POST to %s', async (path, handler) => {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const req = new NextRequest(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 1 }),
    });

    const res = await handler(req);
    expect(res.status).toBe(403);
  });
});
