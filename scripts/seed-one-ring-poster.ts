import { config } from 'dotenv';

config({ path: '.env.local' });
config();

import { and, eq } from 'drizzle-orm';
import {
  getDb,
  hasDatabaseEnv,
  priceEvents,
  serialItems,
  series,
  trackers,
  type TrackerSeoConfig,
  type TrackerThemeConfig,
} from '../src/db';
import { DEFAULT_TRACKER_SLUG } from '../src/lib/tracker-store';
import type { PullChannel } from '../src/lib/types';

export const ONE_RING_TRACKER_SLUG = 'the-one-ring-poster';
export const ONE_RING_SERIES_SLUG = 'one-ring-poster-100';

const ONE_RING_THEME_CONFIG: TrackerThemeConfig = {
  bgHex: '#111014',
  surfaceHex: '#1B181E',
  recessedHex: '#0B0A0D',
  accentHex: '#E07A2F',
  accentBrightHex: '#F4A259',
  fgHex: '#F4EFEA',
  mutedHex: '#ACA39E',
  brandTitle: 'The One Ring /100',
  motifLabel: 'Middle-earth · Forge Ember',
  referenceImageUrl: '/images/one-ring-poster/reference-art.jpg',
  ipNotice:
    'Unofficial community fan ledger — not affiliated with, endorsed, or sponsored by Wizards of the Coast or Middle-earth Enterprises. Magic: The Gathering and The Lord of the Rings are trademarks of their respective owners.',
};

const ONE_RING_SEO_CONFIG: TrackerSeoConfig = {
  iconicNumbers: {
    '1': 'The One Ring (#001)',
    '3': 'Three Rings for the Elven-kings',
    '7': 'Seven for the Dwarf-lords',
    '9': 'Nine for Mortal Men',
    '19': '3+7+9 Rings of Power',
    '33': 'Hobbit Coming of Age',
    '69': 'Collector Favorite',
    '77': 'Lucky 77',
    '99': 'Penultimate (#099)',
    '100': 'Final Print (#100)',
  },
};

const ONE_RING_COMMUNITY_LINKS = [
  {
    name: 'Scryfall — The One Ring (#748z)',
    url: 'https://scryfall.com/card/ltr/748z/the-one-ring',
    description: 'Official card reference, collector number M 0748, and Justine Jones poster artwork.',
  },
  {
    name: 'CGC Population Report (#0748 Serialized)',
    url: 'https://www.cgccards.com/population-report/tcg/magic-the-gathering/113/the-lord-of-the-rings-tales-of-middle-earth/8921/the-one-ring/646289/',
    description: 'Live CGC census for Double Rainbow Serialized Mythic Rare #0748.',
  },
  {
    name: 'PriceCharting — Serialized #748 Sales',
    url: 'https://www.pricecharting.com/game/magic-lord-of-the-rings/the-one-ring-serialized-748',
    description: 'Historical auction archive and realized sale prices for LTR #0748 /100.',
  },
];

interface SeedSerialRecord {
  serialNumber: number;
  foundBy?: string;
  dateFound: string;
  pullChannel?: PullChannel;
  region?: string;
  sourceUrl?: string;
  marketplaceUrl?: string;
  marketplaceLabel?: string;
  imageUrl: string;
  latestPriceCents?: number;
  latestPriceDate?: string;
  gradingService?: string;
  grade?: number;
  gradeLabel?: string;
  certNumber?: string;
  sales?: Array<{
    priceCents: number;
    eventDate: string;
    sourceUrl?: string;
    soldBy?: string;
    soldTo?: string;
  }>;
}

/**
 * 100% primary-source verified records for The One Ring (Borderless Poster /100, LTR #748z).
 * Every serial number, photo, grade, cert number, and realized sale price below was visually
 * verified against primary listings, slab labels, or original pull threads.
 * Unsold asking prices (#063 active eBay listing, #067 screenshot listing) are intentionally omitted.
 */
const VERIFIED_ONE_RING_SERIALS: SeedSerialRecord[] = [
  {
    serialNumber: 1,
    foundBy: 'The Comic Book Store (South Jersey)',
    dateFound: '2023-11-10',
    pullChannel: 'lgs',
    region: 'New Jersey, USA',
    sourceUrl: 'https://mtgrocks.com/mtg-holiday-release-1-one-ring-has-been-found/',
    imageUrl: '/images/one-ring-poster/one-ring-001.jpg',
  },
  {
    serialNumber: 16,
    foundBy: 'collectorcards91 (eBay)',
    dateFound: '2024-10-01',
    marketplaceUrl: 'https://www.ebay.com/itm/186699476309',
    marketplaceLabel: 'eBay',
    imageUrl: '/images/one-ring-poster/one-ring-016.jpg',
    latestPriceCents: 1914934,
    latestPriceDate: '2024-10-01',
    gradingService: 'BGS',
    grade: 10,
    gradeLabel: 'Pristine 10',
    certNumber: '0016892658',
    sales: [
      {
        priceCents: 1914934,
        eventDate: '2024-10-01',
        sourceUrl: 'https://www.ebay.com/itm/186699476309',
        soldBy: 'collectorcards91 (eBay)',
      },
    ],
  },
  {
    serialNumber: 25,
    dateFound: '2024-03-30',
    marketplaceUrl: 'https://www.ebay.com/itm/285789592322',
    marketplaceLabel: 'eBay',
    imageUrl: '/images/one-ring-poster/one-ring-025.jpg',
    latestPriceCents: 780000,
    latestPriceDate: '2024-03-30',
    sales: [
      {
        priceCents: 780000,
        eventDate: '2024-03-30',
        sourceUrl: 'https://www.ebay.com/itm/285789592322',
      },
    ],
  },
  {
    serialNumber: 41,
    dateFound: '2024-02-26',
    marketplaceUrl: 'https://www.ebay.com/itm/166581963930',
    marketplaceLabel: 'eBay',
    imageUrl: '/images/one-ring-poster/one-ring-041.jpg',
    latestPriceCents: 750000,
    latestPriceDate: '2024-02-26',
    sales: [
      {
        priceCents: 750000,
        eventDate: '2024-02-26',
        sourceUrl: 'https://www.ebay.com/itm/166581963930',
      },
    ],
  },
  {
    serialNumber: 56,
    foundBy: 'tcgbeastv6 (eBay)',
    dateFound: '2024-04-08',
    marketplaceUrl: 'https://www.ebay.com/itm/285763831324',
    marketplaceLabel: 'eBay',
    imageUrl: '/images/one-ring-poster/one-ring-056.jpg',
    latestPriceCents: 1500000,
    latestPriceDate: '2024-04-08',
    gradingService: 'BGS',
    grade: 9.5,
    gradeLabel: 'Gem Mint 9.5',
    certNumber: '0016586651',
    sales: [
      {
        priceCents: 1500000,
        eventDate: '2024-04-08',
        sourceUrl: 'https://www.ebay.com/itm/285763831324',
        soldBy: 'tcgbeastv6 (eBay)',
      },
    ],
  },
  {
    serialNumber: 59,
    foundBy: 'u/duqtek (r/MagicCardPulls)',
    dateFound: '2023-12-25',
    sourceUrl: 'https://www.reddit.com/r/MagicCardPulls/comments/18qe56x/one_ring_poster_foil_serial/',
    imageUrl: '/images/one-ring-poster/one-ring-059.jpg',
  },
  {
    serialNumber: 63,
    foundBy: 'TCGBeastV (eBay)',
    dateFound: '2026-11-23',
    region: 'Florida, USA',
    marketplaceUrl: 'https://www.ebay.com/itm/287523813960',
    marketplaceLabel: 'eBay',
    imageUrl: '/images/one-ring-poster/one-ring-063.jpg',
    gradingService: 'PSA',
    grade: 10,
    gradeLabel: 'Gem Mint 10',
    certNumber: '86071731',
  },
  {
    serialNumber: 67,
    dateFound: '2024-11-11',
    sourceUrl: 'https://www.reddit.com/r/MagicCardPulls/comments/18qe56x/comment/lwks76u/',
    imageUrl: '/images/one-ring-poster/one-ring-067.jpg',
    gradingService: 'BGS',
    grade: 10,
    gradeLabel: 'Black Label 10',
    certNumber: '0017230914',
  },
  {
    serialNumber: 91,
    dateFound: '2024-08-06',
    marketplaceUrl: 'https://www.ebay.com/itm/296602176310',
    marketplaceLabel: 'eBay',
    imageUrl: '/images/one-ring-poster/one-ring-091.jpg',
    latestPriceCents: 735374,
    latestPriceDate: '2024-08-06',
    sales: [
      {
        priceCents: 735374,
        eventDate: '2024-08-06',
        sourceUrl: 'https://www.ebay.com/itm/296602176310',
      },
    ],
  },
];

async function main() {
  if (!hasDatabaseEnv()) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const db = getDb();

  // 1. Upsert The One Ring Poster Tracker
  const trackerValues = {
    slug: ONE_RING_TRACKER_SLUG,
    name: 'The One Ring Poster Tracker',
    game: 'MTG',
    setName: 'The Lord of the Rings: Tales of Middle-earth (Holiday Release)',
    description:
      'Community-verified ledger tracking all 100 serialized Double Rainbow Foil Borderless Poster copies of The One Ring (#0748, art by Justine Jones).',
    themeConfig: ONE_RING_THEME_CONFIG,
    seoConfig: ONE_RING_SEO_CONFIG,
    affiliateLinksEnabled: false,
    affiliateConfig: [],
    communityLinks: ONE_RING_COMMUNITY_LINKS,
    isPublished: true,
    updatedAt: new Date(),
  };

  let [trackerRow] = await db
    .select()
    .from(trackers)
    .where(eq(trackers.slug, ONE_RING_TRACKER_SLUG))
    .limit(1);

  if (trackerRow) {
    [trackerRow] = await db
      .update(trackers)
      .set(trackerValues)
      .where(eq(trackers.id, trackerRow.id))
      .returning();
    console.log(`Updated tracker "${trackerRow.slug}" (${trackerRow.id})`);
  } else {
    [trackerRow] = await db.insert(trackers).values(trackerValues).returning();
    console.log(`Created tracker "${trackerRow.slug}" (${trackerRow.id})`);
  }

  // 2. Upsert the 1..100 series
  let [seriesRow] = await db
    .select()
    .from(series)
    .where(and(eq(series.trackerId, trackerRow.id), eq(series.slug, ONE_RING_SERIES_SLUG)))
    .limit(1);

  if (seriesRow) {
    [seriesRow] = await db
      .update(series)
      .set({
        name: 'The One Ring (Poster)',
        serialMin: 1,
        serialMax: 100,
        sortOrder: 0,
      })
      .where(eq(series.id, seriesRow.id))
      .returning();
  } else {
    [seriesRow] = await db
      .insert(series)
      .values({
        trackerId: trackerRow.id,
        slug: ONE_RING_SERIES_SLUG,
        name: 'The One Ring (Poster)',
        serialMin: 1,
        serialMax: 100,
        sortOrder: 0,
      })
      .returning();
    console.log(`Created series "${seriesRow.slug}" (1..100)`);
  }

  // 3. Idempotently upsert all verified serial items & deduplicated price events
  let upsertedItems = 0;
  let insertedSales = 0;

  for (const record of VERIFIED_ONE_RING_SERIALS) {
    const itemValues = {
      seriesId: seriesRow.id,
      serialNumber: record.serialNumber,
      status: 'verified' as const,
      foundBy: record.foundBy ?? null,
      dateFound: record.dateFound,
      pullChannel: record.pullChannel ?? null,
      region: record.region ?? null,
      sourceUrl: record.sourceUrl ?? null,
      marketplaceUrl: record.marketplaceUrl ?? null,
      marketplaceLabel: record.marketplaceLabel ?? null,
      imageUrl: record.imageUrl,
      latestPriceCents: record.latestPriceCents ?? null,
      latestPriceDate: record.latestPriceDate ?? null,
      gradingService: record.gradingService ?? null,
      grade: record.grade ?? null,
      gradeLabel: record.gradeLabel ?? null,
      certNumber: record.certNumber ?? null,
      updatedAt: new Date(),
    };

    const [existingItem] = await db
      .select()
      .from(serialItems)
      .where(
        and(
          eq(serialItems.seriesId, seriesRow.id),
          eq(serialItems.serialNumber, record.serialNumber)
        )
      )
      .limit(1);

    const [savedItem] = existingItem
      ? await db
          .update(serialItems)
          .set(itemValues)
          .where(eq(serialItems.id, existingItem.id))
          .returning()
      : await db.insert(serialItems).values(itemValues).returning();

    upsertedItems++;

    if (record.sales && record.sales.length > 0) {
      const existingEvents = await db
        .select()
        .from(priceEvents)
        .where(eq(priceEvents.itemId, savedItem.id));

      const existingKeys = new Set(
        existingEvents.map((ev) => `${ev.priceCents}|${ev.eventDate.trim()}`)
      );

      for (const sale of record.sales) {
        const key = `${sale.priceCents}|${sale.eventDate.trim()}`;
        if (existingKeys.has(key)) continue;

        await db.insert(priceEvents).values({
          itemId: savedItem.id,
          priceCents: sale.priceCents,
          currency: 'USD',
          eventType: 'sale',
          eventDate: sale.eventDate,
          sourceUrl: sale.sourceUrl ?? null,
          soldBy: sale.soldBy ?? null,
          soldTo: sale.soldTo ?? null,
        });
        existingKeys.add(key);
        insertedSales++;
      }
    }
  }

  // 4. Gently enrich Golden Chocobo tracker's themeConfig metadata for the /hub showcase
  const [chocoboRow] = await db
    .select()
    .from(trackers)
    .where(eq(trackers.slug, DEFAULT_TRACKER_SLUG))
    .limit(1);

  if (chocoboRow) {
    const existingTheme = (chocoboRow.themeConfig || {}) as TrackerThemeConfig;
    const enrichedTheme: TrackerThemeConfig = {
      ...existingTheme,
      brandTitle: existingTheme.brandTitle || 'Golden Chocobo',
      motifLabel: existingTheme.motifLabel || 'Final Fantasy · Antique Gold',
      referenceImageUrl: existingTheme.referenceImageUrl || '/images/chocobo-01.jpg',
    };

    await db
      .update(trackers)
      .set({ themeConfig: enrichedTheme, updatedAt: new Date() })
      .where(eq(trackers.id, chocoboRow.id));
    console.log(`Enriched "${DEFAULT_TRACKER_SLUG}" hub theme metadata.`);
  }

  console.log(
    JSON.stringify(
      {
        status: 'success',
        trackerSlug: trackerRow.slug,
        seriesSlug: seriesRow.slug,
        upsertedItems,
        insertedSales,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
