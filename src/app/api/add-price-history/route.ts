import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { PriceHistoryEntry } from '../../../lib/types';

const redis = Redis.fromEnv();

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { cardId, entry } = await request.json();

    if (!cardId || !entry || entry.price === undefined || !entry.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate price history entry
    if (typeof entry.price !== 'number' || entry.price < 0) {
      return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
    }

    // Get current cards data
    const cardsData = await redis.get('chocobo_cards');
    let cards = cardsData ? JSON.parse(cardsData as string) : [];

    // Find and update the specific card
    const cardIndex = cards.findIndex((card: any) => card.id === cardId);
    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Initialize priceHistory array if it doesn't exist
    if (!cards[cardIndex].priceHistory) {
      cards[cardIndex].priceHistory = [];
    }

    // Add the new price history entry
    cards[cardIndex].priceHistory.push(entry);

    // Sort price history by date (newest first)
    cards[cardIndex].priceHistory.sort((a: PriceHistoryEntry, b: PriceHistoryEntry) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Update the current price to the most recent entry
    if (cards[cardIndex].priceHistory.length > 0) {
      const latestEntry = cards[cardIndex].priceHistory[0];
      cards[cardIndex].price = latestEntry.price;
      cards[cardIndex].priceDate = latestEntry.date;
    }

    // Save back to Redis
    await redis.set('chocobo_cards', JSON.stringify(cards));

    return NextResponse.json({ success: true, card: cards[cardIndex] });
  } catch (error) {
    console.error('Error adding price history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 