import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { ChocoboCard, PriceHistoryEntry } from '@/lib/types';

const redis = Redis.fromEnv();

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { cardId, price } = await request.json();
    const cards: ChocoboCard[] = (await redis.get('chocobo_cards')) || [];

    const cardIndex = cards.findIndex(c => c.id === parseInt(cardId));

    if (cardIndex === -1) {
      return NextResponse.json({ message: 'Card not found' }, { status: 404 });
    }

    const currentDate = new Date().toISOString().split('T')[0];

    // Initialize priceHistory array if it doesn't exist
    if (!cards[cardIndex].priceHistory) {
      cards[cardIndex].priceHistory = [];
    }

    // Add current price to price history
    const historyEntry: PriceHistoryEntry = {
      price: price,
      date: currentDate
    };
    cards[cardIndex].priceHistory.push(historyEntry);

    // Sort price history by date (newest first)
    cards[cardIndex].priceHistory.sort((a: PriceHistoryEntry, b: PriceHistoryEntry) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    cards[cardIndex] = {
      ...cards[cardIndex],
      price: price,
      priceDate: currentDate,
    };

    await redis.set('chocobo_cards', cards);

    return NextResponse.json({ message: 'Price updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating price:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 