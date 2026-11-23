import { NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { readCardsDirect, writeCards } from '@/lib/redis-cards';
import type { PriceHistoryEntry } from '@/lib/types';
import { updatePriceSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = updatePriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, price, date } = parsed.data;
    const cards = await readCardsDirect();
    const cardIndex = cards.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const saleDate = date || new Date().toISOString().split('T')[0];
    const history: PriceHistoryEntry[] = [...(cards[cardIndex].priceHistory || []), { price, date: saleDate }].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    cards[cardIndex] = {
      ...cards[cardIndex],
      price,
      priceDate: saleDate,
      priceHistory: history,
    };

    await writeCards(cards);

    return NextResponse.json({ success: true, message: 'Price updated successfully', card: cards[cardIndex] });
  } catch (error) {
    console.error('Error updating price:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
