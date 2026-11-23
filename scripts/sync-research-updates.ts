import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { hasDatabaseEnv } from '../src/db';
import { hasRedisEnv } from '../src/lib/redis-cards';
import { applyCardPatch, type UpsertSerialPatch } from '../src/lib/tracker-store';
import type { ChocoboCard, GradingInfo, PriceHistoryEntry } from '../src/lib/types';

export interface ResearchCardUpdate {
  serialNumber: number;
  summary: string;
  grading?: GradingInfo;
  priceHistoryEntries?: PriceHistoryEntry[];
  latestPrice?: number;
  latestPriceDate?: string;
}

/**
 * Verified online research updates as of 2026-11-22.
 * Each entry is idempotent: running the script multiple times will not duplicate priceHistory entries.
 */
export const RESEARCH_UPDATES: ResearchCardUpdate[] = [
  {
    serialNumber: 15,
    summary: 'Normalize grading service casing from "bgs" to "BGS" (BGS 9.5).',
    grading: {
      service: 'BGS',
      grade: 9.5,
      dateGraded: '2025-08-07',
    },
  },
  {
    serialNumber: 22,
    summary: 'Add verified eBay sales history for PSA 8 copy ($70k, $70k, $75k, $65k).',
    priceHistoryEntries: [
      { price: 70000, date: '2025-08-24', soldBy: 'eBay' },
      { price: 70000, date: '2025-09-14', soldBy: 'eBay' },
      { price: 75000, date: '2025-09-23', soldBy: 'eBay' },
      { price: 65000, date: '2025-10-23', soldBy: 'eBay' },
    ],
    latestPrice: 65000,
    latestPriceDate: '2025-10-23',
  },
  {
    serialNumber: 38,
    summary: 'Add CGC 8 grading (Cert #6070452001) and Goldin auction sale ($67,100 w/ BP on 2025-09-13).',
    grading: {
      service: 'CGC',
      grade: 8,
      certNumber: '6070452001',
      dateGraded: '2025-09-13',
    },
    priceHistoryEntries: [
      { price: 67100, date: '2025-09-13', soldBy: 'Goldin Auctions' },
    ],
    latestPrice: 67100,
    latestPriceDate: '2025-09-13',
  },
  {
    serialNumber: 45,
    summary: 'Add BGS 9 grading and Goldin auction sale ($83,080 on 2026-02-16).',
    grading: {
      service: 'BGS',
      grade: 9,
      dateGraded: '2026-02-16',
    },
    priceHistoryEntries: [
      { price: 83080, date: '2026-02-16', soldBy: 'Goldin Auctions' },
    ],
    latestPrice: 83080,
    latestPriceDate: '2026-02-16',
  },
  {
    serialNumber: 47,
    summary:
      'Add PSA 10 grading (Cert #123870076, MBA Gold Diamond) and reported $1,400,000 private sale (Nov 2026, via Collectr / Adam Cai).',
    grading: {
      service: 'PSA',
      grade: 10,
      certNumber: '123870076',
      dateGraded: '2026-11-15',
    },
    priceHistoryEntries: [
      {
        price: 1400000,
        date: '2026-11-15',
        soldBy: 'Pristine Collectibles (Adam Cai) — Private Sale via Collectr',
      },
    ],
    latestPrice: 1400000,
    latestPriceDate: '2026-11-15',
  },
  {
    serialNumber: 71,
    summary: 'Add PSA 8 grading (featured in Goldin 2026 Fall TCG Elite Auction, closing 2026-11-30).',
    grading: {
      service: 'PSA',
      grade: 8,
      dateGraded: '2026-11-17',
    },
  },
];

function mergePriceHistory(
  existing: PriceHistoryEntry[] | undefined,
  additions: PriceHistoryEntry[]
): PriceHistoryEntry[] {
  const merged = [...(existing ?? [])];
  for (const entry of additions) {
    const alreadyExists = merged.some(
      (e) => e.price === entry.price && e.date === entry.date
    );
    if (!alreadyExists) {
      merged.push(entry);
    }
  }
  merged.sort((a, b) => a.date.localeCompare(b.date));
  return merged;
}

export function applyUpdatesToCardArray(cards: ChocoboCard[]): ChocoboCard[] {
  const byId = new Map<number, ResearchCardUpdate>();
  for (const update of RESEARCH_UPDATES) {
    byId.set(update.serialNumber, update);
  }

  return cards.map((card) => {
    const update = byId.get(card.id);
    if (!update) return card;

    const next: ChocoboCard = { ...card };

    if (update.grading) {
      next.grading = {
        ...next.grading,
        ...update.grading,
      };
    }

    if (update.priceHistoryEntries && update.priceHistoryEntries.length > 0) {
      next.priceHistory = mergePriceHistory(next.priceHistory, update.priceHistoryEntries);
    }

    if (update.latestPrice !== undefined) {
      next.price = update.latestPrice;
      next.priceDate = update.latestPriceDate ?? next.priceDate;
    }

    return next;
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const localOnly = args.has('--local-only');
  const pullLive = args.has('--pull-live');

  const migratedPath = path.join(process.cwd(), 'migrated_data.json');

  if (pullLive) {
    console.log('Fetching latest live cards from https://goldenchocobotracker.vercel.app/api/cards ...');
    const res = await fetch('https://goldenchocobotracker.vercel.app/api/cards');
    if (!res.ok) {
      throw new Error(`Failed to fetch live cards: HTTP ${res.status}`);
    }
    const liveCards = (await res.json()) as Array<ChocoboCard & { resolvedImage?: string | null }>;
    const cleaned: ChocoboCard[] = liveCards.map((c) => {
      const copy = { ...c };
      delete copy.resolvedImage;
      return copy;
    });
    const updated = applyUpdatesToCardArray(cleaned);
    if (!dryRun) {
      fs.writeFileSync(migratedPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
      console.log(`Synced live snapshot + ${RESEARCH_UPDATES.length} research updates into migrated_data.json`);
    } else {
      console.log(`[dry-run] Would write ${updated.length} cards to migrated_data.json`);
    }
  } else {
    const raw = JSON.parse(fs.readFileSync(migratedPath, 'utf-8')) as ChocoboCard[];
    const updated = applyUpdatesToCardArray(raw);
    if (!dryRun) {
      fs.writeFileSync(migratedPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
      console.log(`Applied ${RESEARCH_UPDATES.length} research updates to migrated_data.json`);
    } else {
      console.log(`[dry-run] Would apply ${RESEARCH_UPDATES.length} research updates to migrated_data.json`);
    }
  }

  if (localOnly) {
    return;
  }

  const hasRemote = hasDatabaseEnv() || hasRedisEnv();
  if (!hasRemote) {
    console.log(
      '\nNo live database/Redis environment variables detected (DATABASE_URL or UPSTASH_REDIS_REST_URL/KV_REST_API_URL).\n' +
        'Local migrated_data.json has been updated. To push these updates to production:\n' +
        '  1. Pull production env vars: vercel env pull .env.local\n' +
        '  2. Run: npm run db:sync-research'
    );
    return;
  }

  const target = hasDatabaseEnv() ? 'Neon Postgres' : 'Upstash Redis';
  console.log(`\nApplying ${RESEARCH_UPDATES.length} research updates to live ${target}...`);

  for (const update of RESEARCH_UPDATES) {
    console.log(`  #${update.serialNumber.toString().padStart(2, '0')}: ${update.summary}`);
    if (dryRun) continue;

    if (update.grading) {
      const gradingPatch: UpsertSerialPatch = { grading: update.grading };
      await applyCardPatch(update.serialNumber, gradingPatch, {
        id: 'research-sync-script',
        login: 'research-sync',
      });
    }

    if (update.priceHistoryEntries) {
      for (const entry of update.priceHistoryEntries) {
        const pricePatch: UpsertSerialPatch = {
          addPriceHistoryEntry: entry,
          price: update.latestPrice ?? entry.price,
          priceDate: update.latestPriceDate ?? entry.date,
        };
        await applyCardPatch(update.serialNumber, pricePatch, {
          id: 'research-sync-script',
          login: 'research-sync',
        });
      }
    }
  }

  console.log(dryRun ? '\nDry run complete.' : `\nLive ${target} sync complete!`);
}

main().catch((err) => {
  console.error('Research sync failed:', err);
  process.exit(1);
});
