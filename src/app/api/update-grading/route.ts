import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { readCardsDirect, writeCards } from '@/lib/redis-cards';
import { updateGradingSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = updateGradingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, grading } = parsed.data;
    const cards = await readCardsDirect();
    const cardIndex = cards.findIndex((card) => card.id === cardId);

    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    cards[cardIndex] = {
      ...cards[cardIndex],
      grading,
    };

    await writeCards(cards);

    return NextResponse.json({ success: true, card: cards[cardIndex] });
  } catch (error) {
    console.error('Error updating grading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
