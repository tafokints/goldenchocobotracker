import { NextRequest, NextResponse } from 'next/server';
import { cardsToCsv } from '@/lib/csv';
import { getSiteUrl } from '@/lib/site-config';
import { getCards } from '@/lib/tracker-store';

export async function GET(request: NextRequest) {
  try {
    const format = (request.nextUrl.searchParams.get('format') || 'csv').toLowerCase();
    const cards = await getCards();

    if (format === 'json') {
      return NextResponse.json(
        {
          source: getSiteUrl(),
          exportedAt: new Date().toISOString(),
          totalCards: cards.length,
          foundCount: cards.filter((c) => c.found).length,
          cards: cards.map((card) => ({
            id: card.id,
            name: card.name,
            found: card.found,
            foundBy: card.foundBy ?? null,
            dateFound: card.dateFound ?? null,
            pullChannel: card.pullChannel ?? null,
            region: card.region ?? null,
            price: card.price ?? null,
            priceDate: card.priceDate ?? null,
            priceHistory: card.priceHistory,
            grading: card.grading ?? null,
          })),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    const csv = cardsToCsv(cards);
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="golden-chocobo-tracker-${dateStamp}.csv"`,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error exporting cards:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
