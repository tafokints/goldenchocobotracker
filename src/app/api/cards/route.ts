import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { ChocoboCard } from '@/lib/types';
import { initialChocoboCards } from '@/lib/chocobo-data';

const redis = Redis.fromEnv();

export async function GET() {
  try {
    let cards: ChocoboCard[] = (await redis.get('chocobo-cards')) || [];
    
    // If no cards exist in Redis, initialize with default data
    if (cards.length === 0) {
      cards = initialChocoboCards;
      await redis.set('chocobo-cards', cards);
    }

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 