import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { applyCardPatch } from '@/lib/tracker-store';
import { addPriceHistorySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = addPriceHistorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, entry } = parsed.data;
    const updatedCard = await applyCardPatch(
      cardId,
      { addPriceHistoryEntry: entry },
      {
        id: adminCheck.session.user.githubId || adminCheck.session.user.githubLogin || 'admin',
        login: adminCheck.session.user.githubLogin,
      },
      { action: 'admin.add_price_history' }
    );

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error) {
    console.error('Error adding price history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
