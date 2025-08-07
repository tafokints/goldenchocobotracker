import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { ChocoboCard } from '@/lib/types';
import { initialChocoboCards } from '@/lib/chocobo-data';

const redis = Redis.fromEnv();

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Try the new key first
    let cards: ChocoboCard[] = (await redis.get('chocobo_cards')) || [];
    
    // If no cards found with new key, try the old key and migrate
    if (cards.length === 0) {
      const oldCardsData = await redis.get('chocobo-cards');
      const oldCards = Array.isArray(oldCardsData) ? oldCardsData : [];
      
      if (oldCards.length > 0) {
        // Migrate data from old key to new key
        cards = oldCards.map((card: any) => ({
          ...card,
          priceHistory: card.priceHistory || [],
          grading: card.grading || undefined
        }));
        await redis.set('chocobo_cards', cards);
        // Optionally delete the old key
        await redis.del('chocobo-cards');
      } else {
        // No existing data, initialize with default
        cards = initialChocoboCards;
        await redis.set('chocobo_cards', cards);
      }
    } else {
      // Ensure all existing cards have the new fields
      cards = cards.map(card => ({
        ...card,
        priceHistory: card.priceHistory || [],
        grading: card.grading || undefined
      }));
    }

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 