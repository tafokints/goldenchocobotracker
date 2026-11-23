import fs from 'node:fs';
import path from 'node:path';
import type { ChocoboCard, ResolvedCard } from './types';

let cachedPublicImages: Map<string, string> | null = null;

/**
 * Reads `public/images` once per server instance and builds a case-insensitive lookup map
 * from lowercase filename -> exact filename on disk.
 * Prevents broken 404 image requests on unfound cards and fixes `.JPG` vs `.jpg` case mismatches
 * on Linux/Vercel deployments.
 */
export function getPublicImageMap(): Map<string, string> {
  if (cachedPublicImages) {
    return cachedPublicImages;
  }

  const map = new Map<string, string>();
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  try {
    const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(entry.name)) continue;
      map.set(entry.name.toLowerCase(), entry.name);
    }
  } catch {
    // Directory missing in unusual runtime environments; fail gracefully with empty map.
  }

  cachedPublicImages = map;
  return map;
}

export function clearPublicImageCache(): void {
  cachedPublicImages = null;
}

/**
 * Resolves a verified image URL for a card, or returns `null` when no image exists.
 * Never returns a guessed `/images/chocobo-XX.jpg` path unless that file actually exists on disk.
 */
export function resolveCardImage(
  card: Pick<ChocoboCard, 'id' | 'image'>,
  imageMap: Map<string, string> = getPublicImageMap()
): string | null {
  if (card.image) {
    const trimmed = card.image.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('/images/')) {
      const requestedFilename = trimmed.slice('/images/'.length).toLowerCase();
      const matched = imageMap.get(requestedFilename);
      if (matched) {
        return `/images/${matched}`;
      }
      // Try switching .jpeg/.jpg extension fallback if renamed
      const base = requestedFilename.replace(/\.(jpe?g|png|webp|avif)$/i, '');
      for (const ext of ['.jpg', '.webp', '.png', '.jpeg']) {
        const alt = imageMap.get(`${base}${ext}`);
        if (alt) return `/images/${alt}`;
      }
      return null;
    }
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
      return trimmed;
    }
  }

  const paddedId = card.id.toString().padStart(2, '0');
  const standardName = `chocobo-${paddedId}.jpg`;
  const matched = imageMap.get(standardName);
  if (matched) {
    return `/images/${matched}`;
  }

  return null;
}

export function attachResolvedImages(cards: ChocoboCard[]): ResolvedCard[] {
  const imageMap = getPublicImageMap();
  return cards.map((card) => ({
    ...card,
    resolvedImage: resolveCardImage(card, imageMap),
  }));
}
