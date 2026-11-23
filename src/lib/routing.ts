import { z } from 'zod';
import { safeHttpUrlSchema } from '@/lib/validation';

export interface HostRouteDecision {
  action: 'next' | 'rewrite';
  destination?: string;
}

const BYPASS_PREFIXES = [
  '/_next',
  '/api',
  '/admin',
  '/icons',
  '/images',
  '/t/',
  '/hub',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/browserconfig.xml',
  '/favicon.ico',
];

const RESERVED_TRACKER_SLUGS = new Set([
  'admin',
  'api',
  'card',
  'hub',
  'stats',
  'submit',
  't',
  'robots.txt',
  'sitemap.xml',
]);

export function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  return rawHost
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

export function parseHubDomains(raw?: string): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((d) => normalizeHost(d))
      .filter(Boolean)
  );
}

export function parseStaticDomainMap(raw?: string): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const [domain, slug] of Object.entries(parsed)) {
      if (typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug)) {
        clean[normalizeHost(domain)] = slug;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function shouldBypassMiddleware(pathname: string): boolean {
  if (BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return true;
  }
  // Skip direct static file requests with extensions (e.g., .png, .jpg, .svg, .ico, .xml, .txt)
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) {
    return true;
  }
  return false;
}

/**
 * Pure hostname-to-route resolver used by Next.js Edge Middleware and unit tests.
 * - Hub domains (`NEXT_PUBLIC_HUB_DOMAINS`) rewrite `/` to `/hub`.
 * - Custom tracker domains (other than the default golden-chocobo primary host) rewrite
 *   `/`, `/stats`, `/submit`, `/card/[id]` to `/t/[trackerSlug]...`.
 * - Default primary domain (`goldenchocobotracker.vercel.app`, `localhost`) passes through to
 *   the native Golden Chocobo routes for zero overhead.
 */
export function resolveHostRoute(input: {
  host: string | null | undefined;
  pathname: string;
  hubDomains: Set<string>;
  matchedTrackerSlug: string | null;
  defaultTrackerSlug?: string;
}): HostRouteDecision {
  const { pathname, hubDomains, matchedTrackerSlug, defaultTrackerSlug = 'golden-chocobo' } = input;
  const host = normalizeHost(input.host);

  if (!host || shouldBypassMiddleware(pathname)) {
    return { action: 'next' };
  }

  if (hubDomains.has(host)) {
    if (pathname === '/') {
      return { action: 'rewrite', destination: '/hub' };
    }
    return { action: 'next' };
  }

  if (matchedTrackerSlug && matchedTrackerSlug !== defaultTrackerSlug) {
    const suffix = pathname === '/' ? '' : pathname;
    return {
      action: 'rewrite',
      destination: `/t/${matchedTrackerSlug}${suffix}`,
    };
  }

  return { action: 'next' };
}

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a 6-digit hex code like #D6A73D');

export const seriesInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9-]+$/, 'Series slug may only contain lowercase letters, numbers, and hyphens'),
    name: z.string().trim().min(2).max(100),
    serialMin: z.coerce.number().int().min(1).max(100_000).default(1),
    serialMax: z.coerce.number().int().min(1).max(100_000),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  })
  .refine((s) => s.serialMax >= s.serialMin, {
    message: 'Serial max must be greater than or equal to serial min',
    path: ['serialMax'],
  });

export const affiliateLinkInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  merchant: z.enum(['Amazon', 'TCGplayer', 'eBay']),
  url: safeHttpUrlSchema,
});

export const communityLinkInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(2).max(160),
  url: safeHttpUrlSchema,
});

export const createTrackerSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Tracker slug may only contain lowercase letters, numbers, and hyphens')
    .refine((s) => !RESERVED_TRACKER_SLUGS.has(s), 'This slug is reserved'),
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .optional()
    .transform((v) => (v ? normalizeHost(v) : undefined))
    .refine(
      (v) => !v || (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(v) && !/(ebay|amazon|tcgplayer)/i.test(v)),
      'Custom domain must be a valid hostname and must not contain merchant trademarks (ebay, amazon, tcgplayer)'
    ),
  name: z.string().trim().min(2).max(100),
  game: z.enum(['mtg', 'pokemon', 'one-piece', 'lorcana', 'sports', 'other']).default('mtg'),
  setName: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(400),
  themeConfig: z
    .object({
      accentHex: hexColorSchema.default('#D6A73D'),
      bgHex: hexColorSchema.default('#201A15'),
      fgHex: hexColorSchema.default('#FFF8F0'),
    })
    .default({ accentHex: '#D6A73D', bgHex: '#201A15', fgHex: '#FFF8F0' }),
  affiliateLinksEnabled: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  affiliateConfig: z.array(affiliateLinkInputSchema).max(12).default([]),
  communityLinks: z.array(communityLinkInputSchema).max(12).default([]),
  series: z.array(seriesInputSchema).min(1, 'At least one series is required').max(50),
});

export const updateTrackerSchema = createTrackerSchema.partial().omit({ slug: true, series: true }).extend({
  addSeries: z.array(seriesInputSchema).max(20).optional(),
});
