import { NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { readCardsDirect, writeCards } from '@/lib/redis-cards';
import { submitCardSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = submitCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, foundBy, dateFound, link, sourceUrl, marketplaceUrl, marketplaceLabel } = parsed.data;
    const cards = await readCardsDirect();
    const cardIndex = cards.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const existing = cards[cardIndex];
    cards[cardIndex] = {
      ...existing,
      found: true,
      foundBy,
      dateFound,
      link: link !== undefined ? link : existing.link,
      sourceUrl: sourceUrl !== undefined ? sourceUrl : existing.sourceUrl,
      marketplaceUrl: marketplaceUrl !== undefined ? marketplaceUrl : existing.marketplaceUrl,
      marketplaceLabel: marketplaceLabel !== undefined ? marketplaceLabel : existing.marketplaceLabel,
      priceHistory: existing.priceHistory || [],
      grading: existing.grading ?? undefined,
    };

    await writeCards(cards);

    return NextResponse.json({ success: true, message: 'Card updated successfully', card: cards[cardIndex] });
  } catch (error) {
    console.error('Error processing card submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
