import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { getDb, hasDatabaseEnv, priceEvents, serialItems, series, trackers } from '../src/db';
import { resolveCardLinks } from '../src/lib/affiliate';
import { resolveCardImage } from '../src/lib/card-images';
import { hasR2Env, uploadPublicCardImage } from '../src/lib/r2';
import { hasRedisEnv, parseStoredCards, readCardsDirect } from '../src/lib/redis-cards';
import {
  DEFAULT_SERIES_SLUG,
  DEFAULT_TRACKER_CONFIG,
  DEFAULT_TRACKER_SLUG,
} from '../src/lib/tracker-store';
import type { ChocoboCard } from '../src/lib/types';

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const uploadToR2 = args.has('--upload-r2');
  const useFallbackJson = args.has('--from-json');

  if (!hasDatabaseEnv()) {
    console.error('Error: DATABASE_URL is not set. Add your Neon Postgres connection string first.');
    process.exit(1);
  }

  let sourceCards: ChocoboCard[];
  if (useFallbackJson) {
    const raw = fs.readFileSync(path.join(process.cwd(), 'migrated_data.json'), 'utf-8');
    sourceCards = parseStoredCards(raw);
    console.log(`Loaded ${sourceCards.length} cards from migrated_data.json`);
  } else {
    if (!hasRedisEnv()) {
      console.error(
        'Error: Upstash Redis env vars (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN) are not set.\n' +
          'Run `vercel env pull .env.local` or pass `--from-json` to test with migrated_data.json.'
      );
      process.exit(1);
    }
    sourceCards = await readCardsDirect();
    console.log(`Loaded ${sourceCards.length} live cards from Upstash Redis`);
  }

  const foundCount = sourceCards.filter((c) => c.found).length;
  console.log(`Summary: ${sourceCards.length} total slots, ${foundCount} found cards.`);

  if (dryRun) {
    console.log('Dry run enabled — no database or R2 writes performed.');
    return;
  }

  if (uploadToR2 && !hasR2Env()) {
    console.error('Error: --upload-r2 specified, but Cloudflare R2 env vars are incomplete.');
    process.exit(1);
  }

  const db = getDb();

  // 1. Upsert golden-chocobo tracker
  let [trackerRow] = await db
    .select()
    .from(trackers)
    .where(eq(trackers.slug, DEFAULT_TRACKER_SLUG))
    .limit(1);

  if (!trackerRow) {
    [trackerRow] = await db.insert(trackers).values(DEFAULT_TRACKER_CONFIG).returning();
    console.log(`Created tracker "${trackerRow.slug}" (${trackerRow.id})`);
  } else {
    console.log(`Using existing tracker "${trackerRow.slug}" (${trackerRow.id})`);
  }

  // 2. Upsert default 1..77 series
  let [seriesRow] = await db
    .select()
    .from(series)
    .where(and(eq(series.trackerId, trackerRow.id), eq(series.slug, DEFAULT_SERIES_SLUG)))
    .limit(1);

  if (!seriesRow) {
    [seriesRow] = await db
      .insert(series)
      .values({
        trackerId: trackerRow.id,
        slug: DEFAULT_SERIES_SLUG,
        name: 'Golden Chocobo',
        serialMin: 1,
        serialMax: 77,
        sortOrder: 0,
      })
      .returning();
    console.log(`Created series "${seriesRow.slug}" (1..77)`);
  }

  // 3. Idempotently upsert all tracked cards & price events
  let migratedItems = 0;
  let migratedEvents = 0;
  let uploadedImages = 0;

  for (const card of sourceCards) {
    const resolvedLocalImage = resolveCardImage(card);
    const hasMeaningfulData =
      card.found ||
      Boolean(resolvedLocalImage) ||
      card.price !== undefined ||
      Boolean(card.grading) ||
      (card.priceHistory && card.priceHistory.length > 0);

    if (!hasMeaningfulData) continue;

    let finalImageUrl = resolvedLocalImage;

    if (uploadToR2 && resolvedLocalImage && resolvedLocalImage.startsWith('/images/')) {
      const diskPath = path.join(process.cwd(), 'public', resolvedLocalImage);
      if (fs.existsSync(diskPath)) {
        const buffer = fs.readFileSync(diskPath);
        const stem = `chocobo-${card.id.toString().padStart(2, '0')}`;
        finalImageUrl = await uploadPublicCardImage(buffer, DEFAULT_TRACKER_SLUG, stem);
        uploadedImages++;
      }
    }

    const { pullSourceUrl, marketplaceUrl, marketplaceLabel } = resolveCardLinks(card);

    const values = {
      seriesId: seriesRow.id,
      serialNumber: card.id,
      status: (card.found ? 'verified' : 'unfound') as 'verified' | 'unfound',
      foundBy: card.foundBy ?? null,
      dateFound: card.dateFound ?? null,
      sourceUrl: pullSourceUrl,
      marketplaceUrl,
      marketplaceLabel: marketplaceUrl ? marketplaceLabel : null,
      imageUrl: finalImageUrl,
      latestPriceCents: typeof card.price === 'number' ? Math.round(card.price * 100) : null,
      latestPriceDate: card.priceDate ?? null,
      gradingService: card.grading?.service ?? null,
      grade: card.grading?.grade ?? null,
      certNumber: card.grading?.certNumber ?? null,
      dateGraded: card.grading?.dateGraded ?? null,
      updatedAt: new Date(),
    };

    const [existingItem] = await db
      .select()
      .from(serialItems)
      .where(and(eq(serialItems.seriesId, seriesRow.id), eq(serialItems.serialNumber, card.id)))
      .limit(1);

    const [savedItem] = existingItem
      ? await db
          .update(serialItems)
          .set(values)
          .where(eq(serialItems.id, existingItem.id))
          .returning()
      : await db.insert(serialItems).values(values).returning();

    migratedItems++;

    // Insert price history entries only if none exist yet for this item (keeps reruns idempotent)
    const existingEvents = await db
      .select()
      .from(priceEvents)
      .where(eq(priceEvents.itemId, savedItem.id));

    if (existingEvents.length === 0 && card.priceHistory?.length > 0) {
      for (const entry of card.priceHistory) {
        await db.insert(priceEvents).values({
          itemId: savedItem.id,
          priceCents: Math.round(entry.price * 100),
          currency: 'USD',
          eventType: 'sale',
          eventDate: entry.date,
          sourceUrl: entry.sourceUrl ?? null,
          soldBy: entry.soldBy ?? null,
          soldTo: entry.soldTo ?? null,
        });
        migratedEvents++;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        status: 'success',
        trackerSlug: trackerRow.slug,
        migratedItems,
        migratedEvents,
        uploadedImages,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
