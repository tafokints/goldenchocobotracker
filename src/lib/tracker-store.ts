import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import {
  auditLogs,
  getDb,
  hasDatabaseEnv,
  priceEvents,
  serialItems,
  series,
  trackers,
} from '@/db';
import {
  COMMUNITY_RESOURCE_LINKS,
  FEATURED_AFFILIATE_LINKS,
  resolveCardLinks,
} from '@/lib/affiliate';
import { attachResolvedImages, resolveCardImage } from '@/lib/card-images';
import {
  CARDS_CACHE_TAG,
  getResolvedCards as getRedisResolvedCards,
  readCardsDirect as readRedisCardsDirect,
  writeCards as writeRedisCards,
} from '@/lib/redis-cards';
import type { ChocoboCard, PriceHistoryEntry, ResolvedCard } from '@/lib/types';

export const DEFAULT_TRACKER_SLUG = 'golden-chocobo';
export const DEFAULT_SERIES_SLUG = 'golden-chocobo';

export const DEFAULT_TRACKER_CONFIG = {
  slug: DEFAULT_TRACKER_SLUG,
  customDomain: 'goldenchocobotracker.vercel.app',
  name: 'Golden Chocobo Tracker',
  game: 'mtg',
  setName: 'Magic: The Gathering × Final Fantasy',
  description:
    "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration.",
  themeConfig: {
    accentHex: '#D6A73D',
    bgHex: '#201A15',
    fgHex: '#FFF8F0',
  },
  affiliateConfig: FEATURED_AFFILIATE_LINKS,
  communityLinks: COMMUNITY_RESOURCE_LINKS,
  seoConfig: {
    title: 'Golden Chocobo Tracker - MTG Final Fantasy Serialized Cards',
    description:
      "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration.",
    ogImage: '/images/chocobo-01.jpg',
  },
  affiliateLinksEnabled: true,
  isPublished: true,
};

export function trackerCacheTag(slug: string): string {
  return `tracker-${slug}`;
}

export function revalidateTrackerCache(slug: string = DEFAULT_TRACKER_SLUG): void {
  try {
    revalidateTag(CARDS_CACHE_TAG);
    revalidateTag(trackerCacheTag(slug));
  } catch {
    // Safe no-op outside Next.js request lifecycle
  }
}

export interface TrackerContext {
  tracker: typeof trackers.$inferSelect;
  seriesList: Array<typeof series.$inferSelect>;
}

/**
 * Fetches a tracker + its ordered series list from Postgres.
 */
export async function getTrackerContextBySlug(slug: string): Promise<TrackerContext | null> {
  if (!hasDatabaseEnv()) return null;
  const db = getDb();

  const [tracker] = await db.select().from(trackers).where(eq(trackers.slug, slug)).limit(1);
  if (!tracker) return null;

  const seriesList = await db
    .select()
    .from(series)
    .where(eq(series.trackerId, tracker.id))
    .orderBy(asc(series.sortOrder), asc(series.name));

  return { tracker, seriesList };
}

/**
 * Converts sparse `serial_items` + `price_events` rows for a series into a full 1..N `ResolvedCard[]`.
 */
export async function readSeriesCardsFromPostgres(
  seriesRow: typeof series.$inferSelect
): Promise<ResolvedCard[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(serialItems)
    .where(eq(serialItems.seriesId, seriesRow.id))
    .orderBy(asc(serialItems.serialNumber));

  const itemIds = rows.map((r) => r.id);
  const eventsByItemId = new Map<string, PriceHistoryEntry[]>();

  if (itemIds.length > 0) {
    const events = await db
      .select()
      .from(priceEvents)
      .where(inArray(priceEvents.itemId, itemIds))
      .orderBy(desc(priceEvents.eventDate), desc(priceEvents.createdAt));

    for (const ev of events) {
      const list = eventsByItemId.get(ev.itemId) || [];
      list.push({
        price: Math.round(ev.priceCents / 100),
        date: ev.eventDate,
        soldBy: ev.soldBy ?? undefined,
        soldTo: ev.soldTo ?? undefined,
        sourceUrl: ev.sourceUrl ?? undefined,
      });
      eventsByItemId.set(ev.itemId, list);
    }
  }

  const bySerial = new Map<number, typeof serialItems.$inferSelect>();
  for (const row of rows) {
    bySerial.set(row.serialNumber, row);
  }

  const totalSlots = seriesRow.serialMax - seriesRow.serialMin + 1;
  const padWidth = Math.max(2, seriesRow.serialMax.toString().length);
  const cards: ChocoboCard[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const serialNumber = seriesRow.serialMin + i;
    const row = bySerial.get(serialNumber);
    const padded = serialNumber.toString().padStart(padWidth, '0');

    if (!row) {
      cards.push({
        id: serialNumber,
        name: `${seriesRow.name} #${padded}`,
        found: false,
        priceHistory: [],
      });
      continue;
    }

    cards.push({
      id: serialNumber,
      name: `${seriesRow.name} #${padded}`,
      found: row.status === 'verified',
      foundBy: row.foundBy ?? undefined,
      dateFound: row.dateFound ?? undefined,
      sourceUrl: row.sourceUrl ?? undefined,
      marketplaceUrl: row.marketplaceUrl ?? undefined,
      marketplaceLabel: row.marketplaceLabel ?? undefined,
      image: row.imageUrl ?? undefined,
      price: row.latestPriceCents !== null ? Math.round(row.latestPriceCents / 100) : undefined,
      priceDate: row.latestPriceDate ?? undefined,
      priceHistory: eventsByItemId.get(row.id) || [],
      grading:
        row.gradingService && row.grade !== null
          ? {
              service: row.gradingService,
              grade: row.grade,
              certNumber: row.certNumber ?? undefined,
              dateGraded: row.dateGraded ?? undefined,
            }
          : undefined,
    });
  }

  // Only resolve local `public/images/chocobo-XX.jpg` automatically for the golden-chocobo series;
  // other trackers use explicit R2/remote `imageUrl`s.
  if (seriesRow.slug === DEFAULT_SERIES_SLUG) {
    return attachResolvedImages(cards);
  }

  return cards.map((card) => ({
    ...card,
    resolvedImage: card.image ? resolveCardImage(card) : null,
  }));
}

async function readDefaultTrackerCardsUncached(): Promise<ResolvedCard[]> {
  if (hasDatabaseEnv()) {
    try {
      const ctx = await getTrackerContextBySlug(DEFAULT_TRACKER_SLUG);
      if (ctx && ctx.seriesList.length > 0) {
        return readSeriesCardsFromPostgres(ctx.seriesList[0]);
      }
    } catch (error) {
      console.warn('Postgres not ready yet, falling back to Upstash Redis:', error);
    }
  }
  return attachResolvedImages(await readRedisCardsDirect());
}

const getCachedDefaultTrackerCards = unstable_cache(
  async (): Promise<ResolvedCard[]> => readDefaultTrackerCardsUncached(),
  ['tracker-cards-default-v1'],
  {
    revalidate: 300,
    tags: [CARDS_CACHE_TAG, trackerCacheTag(DEFAULT_TRACKER_SLUG)],
  }
);

/**
 * Primary read entrypoint for Golden Chocobo pages & APIs.
 * Automatically reads from Neon Postgres once migrated, or falls back transparently to Upstash Redis.
 */
export async function getCards(): Promise<ResolvedCard[]> {
  if (!hasDatabaseEnv()) {
    return getRedisResolvedCards();
  }
  return getCachedDefaultTrackerCards();
}

export async function getCardsFresh(): Promise<ResolvedCard[]> {
  return readDefaultTrackerCardsUncached();
}

export async function getCardById(id: number): Promise<ResolvedCard | null> {
  const cards = await getCards();
  return cards.find((card) => card.id === id) ?? null;
}

export interface AuditActor {
  id: string;
  login?: string;
}

export interface UpsertSerialPatch {
  found?: boolean;
  foundBy?: string;
  dateFound?: string;
  sourceUrl?: string;
  marketplaceUrl?: string;
  marketplaceLabel?: string;
  imageUrl?: string;
  price?: number;
  priceDate?: string;
  addPriceHistoryEntry?: PriceHistoryEntry;
  grading?: {
    service: string;
    grade: number;
    certNumber?: string;
    dateGraded?: string;
  };
  notes?: string;
}

/**
 * Applies a validated admin/approved patch to either Neon Postgres (with audit logging)
 * or Upstash Redis (when `DATABASE_URL` is not yet active).
 */
export async function applyCardPatch(
  serialNumber: number,
  patch: UpsertSerialPatch,
  actor: AuditActor,
  options?: { trackerSlug?: string; seriesId?: string; action?: string }
): Promise<ResolvedCard> {
  const trackerSlug = options?.trackerSlug || DEFAULT_TRACKER_SLUG;

  if (hasDatabaseEnv()) {
    const ctx = await getTrackerContextBySlug(trackerSlug);
    const targetSeries = options?.seriesId
      ? ctx?.seriesList.find((s) => s.id === options.seriesId)
      : ctx?.seriesList[0];

    if (ctx && targetSeries) {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(serialItems)
        .where(
          and(
            eq(serialItems.seriesId, targetSeries.id),
            eq(serialItems.serialNumber, serialNumber)
          )
        )
        .limit(1);

      const nextStatus: 'unfound' | 'verified' =
        patch.found === true
          ? 'verified'
          : patch.found === false
            ? 'unfound'
            : existing?.status ?? 'unfound';

      const newPriceCents =
        patch.price !== undefined
          ? Math.round(patch.price * 100)
          : patch.addPriceHistoryEntry
            ? Math.round(patch.addPriceHistoryEntry.price * 100)
            : undefined;

      const newPriceDate =
        patch.priceDate ??
        patch.addPriceHistoryEntry?.date ??
        (patch.price !== undefined ? new Date().toISOString().split('T')[0] : undefined);

      let shouldUpdateLatestPrice = newPriceCents !== undefined;
      if (
        shouldUpdateLatestPrice &&
        existing?.latestPriceDate &&
        newPriceDate &&
        new Date(newPriceDate).getTime() < new Date(existing.latestPriceDate).getTime()
      ) {
        // Adding a historical sale older than the current latest sale shouldn't overwrite latestPrice
        shouldUpdateLatestPrice = false;
      }

      const nextValues = {
        seriesId: targetSeries.id,
        serialNumber,
        status: nextStatus,
        foundBy: patch.foundBy !== undefined ? patch.foundBy : (existing?.foundBy ?? null),
        dateFound: patch.dateFound !== undefined ? patch.dateFound : (existing?.dateFound ?? null),
        sourceUrl: patch.sourceUrl !== undefined ? patch.sourceUrl : (existing?.sourceUrl ?? null),
        marketplaceUrl:
          patch.marketplaceUrl !== undefined
            ? patch.marketplaceUrl
            : (existing?.marketplaceUrl ?? null),
        marketplaceLabel:
          patch.marketplaceLabel !== undefined
            ? patch.marketplaceLabel
            : (existing?.marketplaceLabel ?? null),
        imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : (existing?.imageUrl ?? null),
        latestPriceCents: shouldUpdateLatestPrice
          ? (newPriceCents ?? existing?.latestPriceCents ?? null)
          : (existing?.latestPriceCents ?? null),
        latestPriceDate: shouldUpdateLatestPrice
          ? (newPriceDate ?? existing?.latestPriceDate ?? null)
          : (existing?.latestPriceDate ?? null),
        gradingService: patch.grading
          ? patch.grading.service
          : (existing?.gradingService ?? null),
        grade: patch.grading ? patch.grading.grade : (existing?.grade ?? null),
        certNumber: patch.grading
          ? (patch.grading.certNumber ?? null)
          : (existing?.certNumber ?? null),
        dateGraded: patch.grading
          ? (patch.grading.dateGraded ?? null)
          : (existing?.dateGraded ?? null),
        notes: patch.notes !== undefined ? patch.notes : (existing?.notes ?? null),
        updatedAt: new Date(),
      };

      const [savedItem] = existing
        ? await db
            .update(serialItems)
            .set(nextValues)
            .where(eq(serialItems.id, existing.id))
            .returning()
        : await db.insert(serialItems).values(nextValues).returning();

      const priceEventToInsert: PriceHistoryEntry | null =
        patch.addPriceHistoryEntry ??
        (patch.price !== undefined
          ? {
              price: patch.price,
              date: newPriceDate || new Date().toISOString().split('T')[0],
            }
          : null);

      if (priceEventToInsert) {
        await db.insert(priceEvents).values({
          itemId: savedItem.id,
          priceCents: Math.round(priceEventToInsert.price * 100),
          currency: 'USD',
          eventType: 'sale',
          eventDate: priceEventToInsert.date,
          sourceUrl: priceEventToInsert.sourceUrl ?? null,
          soldBy: priceEventToInsert.soldBy ?? null,
          soldTo: priceEventToInsert.soldTo ?? null,
        });
      }

      await db.insert(auditLogs).values({
        actorId: actor.id,
        actorLogin: actor.login ?? null,
        action: options?.action || 'item.update',
        entityType: 'serial_item',
        entityId: savedItem.id,
        beforeJson: existing ?? null,
        afterJson: savedItem,
      });

      revalidateTrackerCache(trackerSlug);

      const refreshed = await readSeriesCardsFromPostgres(targetSeries);
      const updated = refreshed.find((c) => c.id === serialNumber);
      if (updated) return updated;
    }
  }

  // Redis fallback path (Phase 1 & 2 compatibility before Neon Postgres is configured)
  const cards = await readRedisCardsDirect();
  const cardIndex = cards.findIndex((c) => c.id === serialNumber);
  if (cardIndex === -1) {
    throw new Error('Card not found');
  }

  const current = cards[cardIndex];
  const updatedHistory: PriceHistoryEntry[] = [...(current.priceHistory || [])];
  if (patch.addPriceHistoryEntry) {
    updatedHistory.push(patch.addPriceHistoryEntry);
  } else if (patch.price !== undefined) {
    updatedHistory.push({
      price: patch.price,
      date: patch.priceDate || new Date().toISOString().split('T')[0],
    });
  }
  updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestFromHistory = updatedHistory[0];

  cards[cardIndex] = {
    ...current,
    found: patch.found !== undefined ? patch.found : current.found,
    foundBy: patch.foundBy !== undefined ? patch.foundBy : current.foundBy,
    dateFound: patch.dateFound !== undefined ? patch.dateFound : current.dateFound,
    sourceUrl: patch.sourceUrl !== undefined ? patch.sourceUrl : current.sourceUrl,
    marketplaceUrl:
      patch.marketplaceUrl !== undefined ? patch.marketplaceUrl : current.marketplaceUrl,
    marketplaceLabel:
      patch.marketplaceLabel !== undefined ? patch.marketplaceLabel : current.marketplaceLabel,
    image: patch.imageUrl !== undefined ? patch.imageUrl : current.image,
    price:
      patch.price !== undefined
        ? patch.price
        : latestFromHistory
          ? latestFromHistory.price
          : current.price,
    priceDate:
      patch.priceDate !== undefined
        ? patch.priceDate
        : latestFromHistory
          ? latestFromHistory.date
          : current.priceDate,
    priceHistory: updatedHistory,
    grading: patch.grading !== undefined ? patch.grading : current.grading,
  };

  await writeRedisCards(cards);
  revalidateTrackerCache(trackerSlug);

  return attachResolvedImages([cards[cardIndex]])[0];
}

/**
 * Helper used during migration to classify legacy `card.link` into clean Postgres columns.
 */
export function splitLegacyCardLinks(card: ChocoboCard) {
  return resolveCardLinks(card);
}
