import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { GradingInfo } from '../../../lib/types';

const redis = Redis.fromEnv();

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { cardId, grading } = await request.json();

    if (!cardId || !grading || !grading.service || grading.grade === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate grading data
    if (typeof grading.grade !== 'number' || grading.grade < 0) {
      return NextResponse.json({ error: 'Invalid grade value' }, { status: 400 });
    }

    // Get current cards data
    const cardsData = await redis.get('chocobo_cards');
    let cards = cardsData ? JSON.parse(cardsData as string) : [];

    // Find and update the specific card
    const cardIndex = cards.findIndex((card: any) => card.id === cardId);
    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Update the card's grading information
    cards[cardIndex].grading = grading;

    // Save back to Redis
    await redis.set('chocobo_cards', JSON.stringify(cards));

    return NextResponse.json({ success: true, card: cards[cardIndex] });
  } catch (error) {
    console.error('Error updating grading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 