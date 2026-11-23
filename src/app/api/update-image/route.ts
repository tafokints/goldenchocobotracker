import { NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { readCardsDirect, writeCards } from '@/lib/redis-cards';
import { updateImageSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = updateImageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, imageUrl } = parsed.data;
    const cards = await readCardsDirect();
    const cardIndex = cards.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    cards[cardIndex] = {
      ...cards[cardIndex],
      image: imageUrl,
    };

    await writeCards(cards);

    return NextResponse.json({ success: true, message: 'Image updated successfully', card: cards[cardIndex] });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
