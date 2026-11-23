import { afterEach, describe, expect, it } from 'vitest';
import { resolveCardImage } from '@/lib/card-images';
import { hasRedisEnv, parseStoredCards } from '@/lib/redis-cards';

describe('parseStoredCards regression tests', () => {
  const sampleCards = [
    { id: 1, name: 'Golden Chocobo #01', found: true, foundBy: 'Alice' },
    { id: 2, found: false },
  ];

  it('parses native arrays returned by @upstash/redis without crashing', () => {
    const result = parseStoredCards(sampleCards);
    expect(result).toHaveLength(2);
    expect(result[0].priceHistory).toEqual([]);
    expect(result[1].name).toBe('Golden Chocobo #02');
  });

  it('parses legacy JSON-stringified arrays and double-stringified payloads safely', () => {
    const singleEncoded = JSON.stringify(sampleCards);
    const doubleEncoded = JSON.stringify(singleEncoded);

    expect(parseStoredCards(singleEncoded)).toHaveLength(2);
    expect(parseStoredCards(doubleEncoded)).toHaveLength(2);
  });

  it('returns empty array on malformed or null Redis values', () => {
    expect(parseStoredCards(null)).toEqual([]);
    expect(parseStoredCards('{bad json')).toEqual([]);
  });
});

describe('hasRedisEnv', () => {
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it('detects Vercel KV / Upstash integration KV_REST_API_* env vars as well as UPSTASH_REDIS_REST_*', () => {
    expect(hasRedisEnv()).toBe(false);

    process.env.KV_REST_API_URL = 'https://example.upstash.io';
    process.env.KV_REST_API_TOKEN = 'secret-token';
    expect(hasRedisEnv()).toBe(true);

    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'secret-token';
    expect(hasRedisEnv()).toBe(true);
  });
});

describe('resolveCardImage', () => {
  const mockImageMap = new Map<string, string>([
    ['chocobo-01.jpg', 'chocobo-01.jpg'],
    ['chocobo-33.jpg', 'chocobo-33.jpg'],
  ]);

  it('resolves legacy uppercase .JPG paths to exact lowercase files on disk', () => {
    expect(resolveCardImage({ id: 33, image: '/images/chocobo-33.JPG' }, mockImageMap)).toBe(
      '/images/chocobo-33.jpg'
    );
  });

  it('returns null instead of a 404 path when no local image exists', () => {
    expect(resolveCardImage({ id: 2 }, mockImageMap)).toBeNull();
    expect(resolveCardImage({ id: 2, image: '/images/nonexistent.jpg' }, mockImageMap)).toBeNull();
  });

  it('preserves valid remote https image URLs', () => {
    expect(
      resolveCardImage({ id: 5, image: 'https://assets.example.com/chocobo-05.webp' }, mockImageMap)
    ).toBe('https://assets.example.com/chocobo-05.webp');
  });
});
