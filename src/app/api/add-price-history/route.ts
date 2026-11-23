import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { readCardsDirect, writeCards } from '@/lib/redis-cards';
import type { PriceHistoryEntry } from '@/lib/types';
import { addPriceHistorySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = addPriceHistorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, entry } = parsed.data;
    const cards = await readCardsDirect();
    const cardIndex = cards.findIndex((card) => card.id === cardId);

    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const updatedHistory: PriceHistoryEntry[] = [...(cards[cardIndex].priceHistory || []), entry].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestEntry = updatedHistory[0];
    cards[cardIndex] = {
      ...cards[cardIndex],
      priceHistory: updatedHistory,
      price: latestEntry ? latestEntry.price : cards[cardIndex].price,
      priceDate: latestEntry ? latestEntry.date : cards[cardIndex].priceDate,
    };

    await writeCards(cards);

    return NextResponse.json({ success: true, card: cards[cardIndex] });
  } catch (error) {
    console.error('Error adding price history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
