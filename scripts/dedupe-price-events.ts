import { config } from 'dotenv';

config({ path: '.env.local' });
config();

import { asc, eq, inArray } from 'drizzle-orm';
import { getDb, hasDatabaseEnv, priceEvents, serialItems } from '../src/db';

interface ScannedPriceEvent {
  id: string;
  itemId: string;
  serialNumber: number | null;
  priceCents: number;
  eventDate: string;
  createdAt: Date;
}

interface DuplicateGroupSummary {
  itemId: string;
  serialNumber: number | null;
  priceUsd: number;
  eventDate: string;
  keptId: string;
  duplicateIds: string[];
}

const DELETE_BATCH_SIZE = 100;

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');

  if (!hasDatabaseEnv()) {
    console.error(
      'Error: DATABASE_URL is not set. Add your Neon Postgres connection string in .env.local or .env first.'
    );
    process.exit(1);
  }

  const db = getDb();

  // Order by createdAt ASC, id ASC so the earliest recorded row is always kept deterministically.
  const rows: ScannedPriceEvent[] = await db
    .select({
      id: priceEvents.id,
      itemId: priceEvents.itemId,
      serialNumber: serialItems.serialNumber,
      priceCents: priceEvents.priceCents,
      eventDate: priceEvents.eventDate,
      createdAt: priceEvents.createdAt,
    })
    .from(priceEvents)
    .leftJoin(serialItems, eq(priceEvents.itemId, serialItems.id))
    .orderBy(asc(priceEvents.createdAt), asc(priceEvents.id));

  const keptByKey = new Map<string, ScannedPriceEvent>();
  const duplicatesByKey = new Map<string, DuplicateGroupSummary>();
  const duplicateIds: string[] = [];

  for (const row of rows) {
    const normalizedDate = row.eventDate.trim();
    const key = `${row.itemId}|${row.priceCents}|${normalizedDate}`;
    const kept = keptByKey.get(key);

    if (!kept) {
      keptByKey.set(key, row);
      continue;
    }

    duplicateIds.push(row.id);

    let group = duplicatesByKey.get(key);
    if (!group) {
      group = {
        itemId: row.itemId,
        serialNumber: row.serialNumber,
        priceUsd: Math.round(row.priceCents / 100),
        eventDate: normalizedDate,
        keptId: kept.id,
        duplicateIds: [],
      };
      duplicatesByKey.set(key, group);
    }
    group.duplicateIds.push(row.id);
  }

  const groups = Array.from(duplicatesByKey.values());
  if (groups.length > 0) {
    console.log(
      `${dryRun ? '[dry-run] ' : ''}Found ${duplicateIds.length} duplicate price_events row(s) across ${groups.length} group(s):`
    );
    for (const group of groups) {
      const cardLabel =
        group.serialNumber !== null
          ? `#${group.serialNumber.toString().padStart(2, '0')}`
          : group.itemId;
      console.log(
        `  ${cardLabel} | $${group.priceUsd.toLocaleString()} on ${group.eventDate} | keeping ${group.keptId}, removing ${group.duplicateIds.length} duplicate(s)`
      );
    }
  }

  let deletedCount = 0;
  if (!dryRun && duplicateIds.length > 0) {
    for (let i = 0; i < duplicateIds.length; i += DELETE_BATCH_SIZE) {
      const chunk = duplicateIds.slice(i, i + DELETE_BATCH_SIZE);
      await db.delete(priceEvents).where(inArray(priceEvents.id, chunk));
      deletedCount += chunk.length;
    }
  }

  console.log(
    JSON.stringify(
      {
        status: 'success',
        dryRun,
        totalEventsScanned: rows.length,
        duplicateGroups: groups.length,
        duplicatesFound: duplicateIds.length,
        duplicatesDeleted: deletedCount,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Dedupe price_events failed:', err);
  process.exit(1);
});
