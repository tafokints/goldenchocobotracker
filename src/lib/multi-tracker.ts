import { asc, eq } from 'drizzle-orm';
import { Redis } from '@upstash/redis';
import { revalidateTag, unstable_cache } from 'next/cache';
import { getDb, hasDatabaseEnv, serialItems, series, trackers } from '@/db';
import { hasRedisEnv } from '@/lib/redis-cards';
import { normalizeHost } from '@/lib/routing';
import {
  DEFAULT_SERIES_SLUG,
  DEFAULT_TRACKER_CONFIG,
  DEFAULT_TRACKER_SLUG,
  getCards,
  getTrackerContextBySlug,
  readSeriesCardsFromPostgres,
  trackerCacheTag,
} from '@/lib/tracker-store';
import type { ResolvedCard } from '@/lib/types';

export const HUB_CACHE_TAG = 'trackers-hub';
export const DOMAIN_REDIS_PREFIX = 'tracker:domain:';

export interface TrackerSummary {
  id: string;
  slug: string;
  customDomain: string | null;
  name: string;
  game: string;
  setName: string;
  description: string;
  accentHex: string;
  bgHex: string;
  seriesCount: number;
  totalSerials: number;
  foundCount: number;
  affiliateLinksEnabled: boolean;
  isPublished: boolean;
}

export interface SeriesWithCards {
  id: string;
  slug: string;
  name: string;
  serialMin: number;
  serialMax: number;
  totalCount: number;
  foundCount: number;
  cards: ResolvedCard[];
}

export interface HydratedTracker {
  id: string;
  slug: string;
  customDomain: string | null;
  name: string;
  game: string;
  setName: string;
  description: string;
  themeConfig: { accentHex: string; bgHex: string; fgHex: string };
  affiliateConfig: typeof DEFAULT_TRACKER_CONFIG.affiliateConfig;
  communityLinks: typeof DEFAULT_TRACKER_CONFIG.communityLinks;
  affiliateLinksEnabled: boolean;
  isPublished: boolean;
  series: SeriesWithCards[];
}

export function revalidateHubCache(): void {
  try {
    revalidateTag(HUB_CACHE_TAG);
  } catch {
    // Safe no-op outside Next.js request context
  }
}

/**
 * Syncs custom domain -> tracker slug mapping to Upstash Redis so Edge Middleware
 * can resolve newly added custom domains in ~2ms without touching Postgres.
 */
export async function syncDomainRouteInRedis(
  customDomain: string | null | undefined,
  trackerSlug: string,
  previousDomain?: string | null
): Promise<void> {
  if (!hasRedisEnv()) return;
  const redis = Redis.fromEnv();

  if (previousDomain) {
    const cleanPrev = normalizeHost(previousDomain);
    if (cleanPrev && cleanPrev !== normalizeHost(customDomain)) {
      await redis.del(`${DOMAIN_REDIS_PREFIX}${cleanPrev}`);
    }
  }

  if (customDomain) {
    const clean = normalizeHost(customDomain);
    if (clean) {
      await redis.set(`${DOMAIN_REDIS_PREFIX}${clean}`, trackerSlug);
    }
  }
}

async function fetchPublishedTrackersUncached(): Promise<TrackerSummary[]> {
  if (hasDatabaseEnv()) {
    const db = getDb();
    const trackerRows = await db
      .select()
      .from(trackers)
      .where(eq(trackers.isPublished, true))
      .orderBy(asc(trackers.createdAt));

    if (trackerRows.length > 0) {
      const summaries: TrackerSummary[] = [];

      for (const t of trackerRows) {
        const seriesRows = await db
          .select()
          .from(series)
          .where(eq(series.trackerId, t.id))
          .orderBy(asc(series.sortOrder));

        let totalSerials = 0;
        let foundCount = 0;

        for (const s of seriesRows) {
          totalSerials += s.serialMax - s.serialMin + 1;
          const items = await db
            .select({ status: serialItems.status })
            .from(serialItems)
            .where(eq(serialItems.seriesId, s.id));
          foundCount += items.filter((item) => item.status === 'verified').length;
        }

        summaries.push({
          id: t.id,
          slug: t.slug,
          customDomain: t.customDomain,
          name: t.name,
          game: t.game,
          setName: t.setName,
          description: t.description,
          accentHex: t.themeConfig?.accentHex || '#D6A73D',
          bgHex: t.themeConfig?.bgHex || '#201A15',
          seriesCount: seriesRows.length,
          totalSerials,
          foundCount,
          affiliateLinksEnabled: t.affiliateLinksEnabled,
          isPublished: t.isPublished,
        });
      }

      return summaries;
    }
  }

  // Fallback before Postgres is provisioned: show Golden Chocobo Tracker seamlessly in /hub
  const defaultCards = await getCards();
  return [
    {
      id: 'default-golden-chocobo',
      slug: DEFAULT_TRACKER_SLUG,
      customDomain: DEFAULT_TRACKER_CONFIG.customDomain,
      name: DEFAULT_TRACKER_CONFIG.name,
      game: DEFAULT_TRACKER_CONFIG.game,
      setName: DEFAULT_TRACKER_CONFIG.setName,
      description: DEFAULT_TRACKER_CONFIG.description,
      accentHex: DEFAULT_TRACKER_CONFIG.themeConfig.accentHex,
      bgHex: DEFAULT_TRACKER_CONFIG.themeConfig.bgHex,
      seriesCount: 1,
      totalSerials: defaultCards.length || 77,
      foundCount: defaultCards.filter((c) => c.found).length,
      affiliateLinksEnabled: true,
      isPublished: true,
    },
  ];
}

const getCachedPublishedTrackers = unstable_cache(
  async () => fetchPublishedTrackersUncached(),
  ['published-trackers-hub-v1'],
  { revalidate: 300, tags: [HUB_CACHE_TAG] }
);

export async function listPublishedTrackers(): Promise<TrackerSummary[]> {
  return getCachedPublishedTrackers();
}

async function hydrateTrackerUncached(slug: string): Promise<HydratedTracker | null> {
  if (hasDatabaseEnv()) {
    const ctx = await getTrackerContextBySlug(slug);
    if (ctx) {
      const seriesWithCards: SeriesWithCards[] = [];
      for (const s of ctx.seriesList) {
        const cards = await readSeriesCardsFromPostgres(s);
        seriesWithCards.push({
          id: s.id,
          slug: s.slug,
          name: s.name,
          serialMin: s.serialMin,
          serialMax: s.serialMax,
          totalCount: cards.length,
          foundCount: cards.filter((c) => c.found).length,
          cards,
        });
      }

      return {
        id: ctx.tracker.id,
        slug: ctx.tracker.slug,
        customDomain: ctx.tracker.customDomain,
        name: ctx.tracker.name,
        game: ctx.tracker.game,
        setName: ctx.tracker.setName,
        description: ctx.tracker.description,
        themeConfig: {
          accentHex: ctx.tracker.themeConfig?.accentHex || '#D6A73D',
          bgHex: ctx.tracker.themeConfig?.bgHex || '#201A15',
          fgHex: ctx.tracker.themeConfig?.fgHex || '#FFF8F0',
        },
        affiliateConfig: ctx.tracker.affiliateConfig || [],
        communityLinks: ctx.tracker.communityLinks || [],
        affiliateLinksEnabled: ctx.tracker.affiliateLinksEnabled,
        isPublished: ctx.tracker.isPublished,
        series: seriesWithCards,
      };
    }
  }

  // Fallback for `/t/golden-chocobo` before Postgres migration runs
  if (slug === DEFAULT_TRACKER_SLUG) {
    const cards = await getCards();
    return {
      id: 'default-golden-chocobo',
      slug: DEFAULT_TRACKER_SLUG,
      customDomain: DEFAULT_TRACKER_CONFIG.customDomain,
      name: DEFAULT_TRACKER_CONFIG.name,
      game: DEFAULT_TRACKER_CONFIG.game,
      setName: DEFAULT_TRACKER_CONFIG.setName,
      description: DEFAULT_TRACKER_CONFIG.description,
      themeConfig: DEFAULT_TRACKER_CONFIG.themeConfig,
      affiliateConfig: DEFAULT_TRACKER_CONFIG.affiliateConfig,
      communityLinks: DEFAULT_TRACKER_CONFIG.communityLinks,
      affiliateLinksEnabled: true,
      isPublished: true,
      series: [
        {
          id: 'default-series',
          slug: DEFAULT_SERIES_SLUG,
          name: 'Golden Chocobo',
          serialMin: 1,
          serialMax: cards.length || 77,
          totalCount: cards.length || 77,
          foundCount: cards.filter((c) => c.found).length,
          cards,
        },
      ],
    };
  }

  return null;
}

export async function getHydratedTracker(slug: string): Promise<HydratedTracker | null> {
  const cached = unstable_cache(
    async () => hydrateTrackerUncached(slug),
    [`hydrated-tracker-${slug}-v1`],
    {
      revalidate: 300,
      tags: [HUB_CACHE_TAG, trackerCacheTag(slug)],
    }
  );
  return cached();
}
