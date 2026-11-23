import fs from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { revalidateTag, unstable_cache } from 'next/cache';
import { initialChocoboCards } from './chocobo-data';
import { attachResolvedImages } from './card-images';
import type { ChocoboCard, ResolvedCard } from './types';

export const CARDS_REDIS_KEY = 'chocobo_cards';
export const LEGACY_CARDS_REDIS_KEY = 'chocobo-cards';
export const CARDS_CACHE_TAG = 'chocobo-cards';

let redisClient: Redis | null = null;

export function hasRedisEnv(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

function getRedis(): Redis | null {
  if (!hasRedisEnv()) return null;
  if (!redisClient) {
    redisClient = Redis.fromEnv();
  }
  return redisClient;
}

/**
 * Safely parses raw Redis values whether `@upstash/redis` returned a deserialized array
 * or a legacy JSON-encoded string (fixes historical double-stringification bugs).
 */
export function parseStoredCards(raw: unknown): ChocoboCard[] {
  let parsed: unknown = raw;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
      // Handle accidental double-encoded strings cleanly
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((card: Partial<ChocoboCard>, index) => {
    const id = typeof card.id === 'number' ? card.id : index + 1;
    return {
      ...card,
      id,
      name: card.name || `Golden Chocobo #${id.toString().padStart(2, '0')}`,
      found: Boolean(card.found),
      priceHistory: Array.isArray(card.priceHistory) ? card.priceHistory : [],
      grading: card.grading ?? undefined,
    };
  });
}

function loadLocalFallbackCards(): ChocoboCard[] {
  try {
    const filePath = path.join(process.cwd(), 'migrated_data.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseStoredCards(content);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back to empty 77-card template
  }
  return initialChocoboCards;
}

/**
 * Reads live cards directly from Upstash Redis (uncached).
 * Used by write handlers and the cached server loader below.
 */
export async function readCardsDirect(): Promise<ChocoboCard[]> {
  const redis = getRedis();
  if (!redis) {
    return loadLocalFallbackCards();
  }

  const primaryRaw = await redis.get(CARDS_REDIS_KEY);
  let cards = parseStoredCards(primaryRaw);

  if (cards.length === 0) {
    const legacyRaw = await redis.get(LEGACY_CARDS_REDIS_KEY);
    const legacyCards = parseStoredCards(legacyRaw);

    if (legacyCards.length > 0) {
      cards = legacyCards;
      await redis.set(CARDS_REDIS_KEY, cards);
      await redis.del(LEGACY_CARDS_REDIS_KEY);
    } else {
      cards = initialChocoboCards;
      await redis.set(CARDS_REDIS_KEY, cards);
    }
  }

  return cards;
}

/**
 * Persists updated card array to Upstash Redis as a native JSON array and invalidates
 * Next.js ISR/Data Cache tags so Server Components reflect updates immediately.
 */
export async function writeCards(cards: ChocoboCard[]): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error('Upstash Redis environment variables are not configured');
  }

  await redis.set(CARDS_REDIS_KEY, cards);

  try {
    revalidateTag(CARDS_CACHE_TAG);
  } catch {
    // Safe no-op outside Next.js request lifecycle (e.g. unit tests / scripts)
  }
}

const getCachedRawCards = unstable_cache(
  async (): Promise<ChocoboCard[]> => readCardsDirect(),
  ['chocobo-cards-v1'],
  {
    revalidate: 300,
    tags: [CARDS_CACHE_TAG],
  }
);

/**
 * Server Component data loader: cached for 5 minutes (and invalidated on demand via `revalidateTag`)
 * with verified local/remote image URLs attached.
 */
export async function getResolvedCards(): Promise<ResolvedCard[]> {
  const cards = await getCachedRawCards();
  return attachResolvedImages(cards);
}

export async function getResolvedCardById(id: number): Promise<ResolvedCard | null> {
  const cards = await getResolvedCards();
  return cards.find((card) => card.id === id) ?? null;
}
