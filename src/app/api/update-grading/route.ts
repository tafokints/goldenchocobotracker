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
    console.log('Received grading update request:', { cardId, grading });

    if (!cardId || !grading || !grading.service || grading.grade === undefined) {
      console.log('Validation failed:', { cardId, grading });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert grade to number and validate
    const gradeValue = typeof grading.grade === 'string' ? parseFloat(grading.grade) : grading.grade;
    if (isNaN(gradeValue) || gradeValue < 0) {
      console.log('Invalid grade value:', grading.grade);
      return NextResponse.json({ error: 'Invalid grade value' }, { status: 400 });
    }

    // Update the grading object with the numeric grade
    const validatedGrading = {
      ...grading,
      grade: gradeValue
    };

    // Get current cards data
    const cardsData = await redis.get('chocobo_cards');
    console.log('Retrieved cards data from Redis:', cardsData ? 'exists' : 'null');
    let cards = Array.isArray(cardsData) ? cardsData : (cardsData ? JSON.parse(cardsData as string) : []);
    console.log('Parsed cards array length:', cards.length);

    // Find and update the specific card
    const cardIndex = cards.findIndex((card: any) => card.id === cardId);
    console.log('Found card at index:', cardIndex);
    if (cardIndex === -1) {
      console.log('Card not found with ID:', cardId);
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Update the card's grading information
    console.log('Updating card grading from:', cards[cardIndex].grading, 'to:', validatedGrading);
    cards[cardIndex].grading = validatedGrading;

    // Save back to Redis
    const saveResult = await redis.set('chocobo_cards', JSON.stringify(cards));
    console.log('Save result:', saveResult);

    return NextResponse.json({ success: true, card: cards[cardIndex] });
  } catch (error) {
    console.error('Error updating grading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 