import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { ChocoboCard } from '@/lib/types';

const redis = Redis.fromEnv();

export async function POST(request: Request) {
  try {
    const submission = await request.json();
    const cards: ChocoboCard[] = (await redis.get('chocobo-cards')) || [];

    const cardIndex = cards.findIndex(c => c.id === parseInt(submission.cardId));

    if (cardIndex === -1) {
      return NextResponse.json({ message: 'Card not found' }, { status: 404 });
    }

    cards[cardIndex] = {
      ...cards[cardIndex],
      found: true,
      foundBy: submission.foundBy,
      dateFound: submission.dateFound,
      link: submission.link,
    };

    await redis.set('chocobo-cards', cards);

    return NextResponse.json({ message: 'Submission successful' }, { status: 200 });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 