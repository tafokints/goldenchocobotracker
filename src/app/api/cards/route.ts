import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { attachResolvedImages } from '@/lib/card-images';
import { getResolvedCards, readCardsDirect } from '@/lib/redis-cards';

export async function GET(request: NextRequest) {
  try {
    const wantsFresh = request.nextUrl.searchParams.get('fresh') === '1';

    if (wantsFresh) {
      const session = await auth();
      if (session?.user?.isAdmin) {
        const freshCards = attachResolvedImages(await readCardsDirect());
        return NextResponse.json(freshCards, {
          headers: { 'Cache-Control': 'private, no-store' },
        });
      }
    }

    const cards = await getResolvedCards();
    return NextResponse.json(cards, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
