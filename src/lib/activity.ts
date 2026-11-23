import { GOLDEN_CHOCOBO_ICONIC_NUMBERS, getIconicLabel } from '@/lib/iconic-numbers';
import type { ResolvedCard } from '@/lib/types';

export type ActivityEventType = 'pull' | 'sale' | 'grading';

export interface ActivityEvent {
  id: string;
  cardId: number;
  paddedId: string;
  type: ActivityEventType;
  date: string;
  timestamp: number;
  title: string;
  summary: string;
  iconicLabel: string | null;
}

/**
 * Extracts a chronological feed of verified discovery, sale, and grading events across cards.
 * Used by both the homepage Latest Activity Strip and `/feed.xml` RSS feed.
 */
export function buildRecentActivity(
  cards: ResolvedCard[],
  options?: { limit?: number; iconicMap?: Record<number, string>; padWidth?: number }
): ActivityEvent[] {
  const limit = options?.limit ?? 8;
  const iconicMap = options?.iconicMap ?? GOLDEN_CHOCOBO_ICONIC_NUMBERS;
  const padWidth = options?.padWidth ?? 2;

  const events: ActivityEvent[] = [];

  for (const card of cards) {
    const paddedId = card.id.toString().padStart(padWidth, '0');
    const iconicLabel = getIconicLabel(card.id, iconicMap);

    if (card.found && card.dateFound) {
      const ts = new Date(card.dateFound).getTime();
      if (!Number.isNaN(ts)) {
        events.push({
          id: `pull-${card.id}-${card.dateFound}`,
          cardId: card.id,
          paddedId,
          type: 'pull',
          date: card.dateFound,
          timestamp: ts,
          title: `#${paddedId} Pulled${card.foundBy ? ` by ${card.foundBy}` : ''}`,
          summary: `Serialized #${paddedId} discovered${card.foundBy ? ` by ${card.foundBy}` : ''}${
            card.region ? ` (${card.region})` : ''
          }.`,
          iconicLabel,
        });
      }
    }

    const seenSales = new Set<string>();
    for (const entry of card.priceHistory || []) {
      const key = `${entry.date}-${entry.price}`;
      if (seenSales.has(key)) continue;
      seenSales.add(key);

      const ts = new Date(entry.date).getTime();
      if (!Number.isNaN(ts)) {
        events.push({
          id: `sale-${card.id}-${entry.date}-${entry.price}`,
          cardId: card.id,
          paddedId,
          type: 'sale',
          date: entry.date,
          timestamp: ts,
          title: `#${paddedId} Sold — $${entry.price.toLocaleString()}`,
          summary: `Reported sale for #${paddedId} at $${entry.price.toLocaleString()}${
            entry.soldTo ? ` to ${entry.soldTo}` : ''
          }.`,
          iconicLabel,
        });
      }
    }

    if (
      typeof card.price === 'number' &&
      card.priceDate &&
      !seenSales.has(`${card.priceDate}-${card.price}`)
    ) {
      const ts = new Date(card.priceDate).getTime();
      if (!Number.isNaN(ts)) {
        events.push({
          id: `sale-${card.id}-${card.priceDate}-${card.price}`,
          cardId: card.id,
          paddedId,
          type: 'sale',
          date: card.priceDate,
          timestamp: ts,
          title: `#${paddedId} Sold — $${card.price.toLocaleString()}`,
          summary: `Reported sale for #${paddedId} at $${card.price.toLocaleString()}.`,
          iconicLabel,
        });
      }
    }

    if (card.grading && card.grading.dateGraded) {
      const ts = new Date(card.grading.dateGraded).getTime();
      if (!Number.isNaN(ts)) {
        events.push({
          id: `grade-${card.id}-${card.grading.dateGraded}`,
          cardId: card.id,
          paddedId,
          type: 'grading',
          date: card.grading.dateGraded,
          timestamp: ts,
          title: `#${paddedId} Graded ${card.grading.service} ${card.grading.grade}`,
          summary: `#${paddedId} received ${card.grading.service} ${card.grading.grade}${
            card.grading.certNumber ? ` (Cert #${card.grading.certNumber})` : ''
          }.`,
          iconicLabel,
        });
      }
    }
  }

  return events
    .sort((a, b) => b.timestamp - a.timestamp || b.cardId - a.cardId)
    .slice(0, limit);
}
