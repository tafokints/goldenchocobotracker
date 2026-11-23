import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const { mockRequireAdmin } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

import { GET as listAdminTrackers, POST as createAdminTracker } from '@/app/api/admin/trackers/route';
import { PATCH as updateAdminTracker } from '@/app/api/admin/trackers/[id]/route';
import {
  createTrackerSchema,
  normalizeHost,
  parseHubDomains,
  resolveHostRoute,
} from '@/lib/routing';

describe('multi-tracker middleware routing', () => {
  const hubDomains = parseHubDomains('serialhub.com, www.myhub.gg');

  it('normalizes hosts by stripping ports, casing, and www prefix', () => {
    expect(normalizeHost('WWW.GoldenChocoboTracker.com:443')).toBe('goldenchocobotracker.com');
    expect(normalizeHost('localhost:3000')).toBe('localhost');
  });

  it('rewrites hub domain root to /hub while keeping /t/[slug] paths intact', () => {
    expect(
      resolveHostRoute({
        host: 'www.serialhub.com',
        pathname: '/',
        hubDomains,
        matchedTrackerSlug: null,
      })
    ).toEqual({ action: 'rewrite', destination: '/hub' });

    expect(
      resolveHostRoute({
        host: 'serialhub.com',
        pathname: '/t/lotr-sol-rings',
        hubDomains,
        matchedTrackerSlug: null,
      })
    ).toEqual({ action: 'next' });
  });

  it('rewrites custom tracker domains transparently to /t/[slug]...', () => {
    expect(
      resolveHostRoute({
        host: 'solringtracker.com',
        pathname: '/',
        hubDomains,
        matchedTrackerSlug: 'lotr-sol-rings',
      })
    ).toEqual({ action: 'rewrite', destination: '/t/lotr-sol-rings' });

    expect(
      resolveHostRoute({
        host: 'solringtracker.com',
        pathname: '/stats',
        hubDomains,
        matchedTrackerSlug: 'lotr-sol-rings',
      })
    ).toEqual({ action: 'rewrite', destination: '/t/lotr-sol-rings/stats' });

    expect(
      resolveHostRoute({
        host: 'solringtracker.com',
        pathname: '/card/042',
        hubDomains,
        matchedTrackerSlug: 'lotr-sol-rings',
      })
    ).toEqual({ action: 'rewrite', destination: '/t/lotr-sol-rings/card/042' });
  });

  it('bypasses internal, admin, API, and static asset paths', () => {
    for (const path of ['/admin', '/admin/queue', '/api/cards', '/images/chocobo-01.jpg', '/sitemap.xml']) {
      expect(
        resolveHostRoute({
          host: 'solringtracker.com',
          pathname: path,
          hubDomains,
          matchedTrackerSlug: 'lotr-sol-rings',
        })
      ).toEqual({ action: 'next' });
    }
  });
});

describe('createTrackerSchema validation & affiliate trademark rules', () => {
  it('accepts a multi-series tracker (e.g., LOTR Sol Rings)', () => {
    const res = createTrackerSchema.safeParse({
      slug: 'lotr-sol-rings',
      customDomain: 'solringtracker.com',
      name: 'LOTR Serialized Sol Rings',
      game: 'mtg',
      setName: 'Tales of Middle-earth',
      description: 'Track serialized Elven, Dwarven, and Human Sol Ring pulls and reported sales.',
      series: [
        { slug: 'elven', name: 'Elven Sol Ring', serialMin: 1, serialMax: 300, sortOrder: 0 },
        { slug: 'dwarven', name: 'Dwarven Sol Ring', serialMin: 1, serialMax: 700, sortOrder: 1 },
        { slug: 'human', name: 'Human Sol Ring', serialMin: 1, serialMax: 900, sortOrder: 2 },
      ],
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.affiliateLinksEnabled).toBe(false);
    }
  });

  it('rejects merchant trademarks in custom domains and reserved slugs', () => {
    const ebayDomain = createTrackerSchema.safeParse({
      slug: 'my-tracker',
      customDomain: 'ebay-chocobo-tracker.com',
      name: 'Bad Domain Tracker',
      setName: 'Test Set',
      description: 'Description long enough to pass validation.',
      series: [{ slug: 's1', name: 'Series 1', serialMin: 1, serialMax: 100 }],
    });
    expect(ebayDomain.success).toBe(false);

    const reservedSlug = createTrackerSchema.safeParse({
      slug: 'admin',
      name: 'Reserved Slug',
      setName: 'Test Set',
      description: 'Description long enough to pass validation.',
      series: [{ slug: 's1', name: 'Series 1', serialMin: 1, serialMax: 100 }],
    });
    expect(reservedSlug.success).toBe(false);
  });
});

describe('admin tracker endpoints enforce auth', () => {
  it('returns 401/403 when unauthorized', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
    expect((await listAdminTrackers()).status).toBe(401);

    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });
    const postReq = new NextRequest('http://localhost:3000/api/admin/trackers', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect((await createAdminTracker(postReq)).status).toBe(403);

    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });
    const patchReq = new NextRequest('http://localhost:3000/api/admin/trackers/t-1', {
      method: 'PATCH',
      body: JSON.stringify({ isPublished: true }),
    });
    expect((await updateAdminTracker(patchReq, { params: Promise.resolve({ id: 't-1' }) })).status).toBe(403);
  });
});
