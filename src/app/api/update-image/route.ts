import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { ChocoboCard } from '@/lib/types';

const redis = Redis.fromEnv();

export async function POST(request: Request) {
  try {
    const { cardId, imageUrl } = await request.json();
    const cards: ChocoboCard[] = (await redis.get('chocobo_cards')) || [];

    const cardIndex = cards.findIndex(c => c.id === parseInt(cardId));

    if (cardIndex === -1) {
      return NextResponse.json({ message: 'Card not found' }, { status: 404 });
    }

    cards[cardIndex] = {
      ...cards[cardIndex],
      image: imageUrl,
    };

    await redis.set('chocobo_cards', cards);

    return NextResponse.json({ message: 'Image updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 