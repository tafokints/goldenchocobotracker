import { NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { applyCardPatch } from '@/lib/tracker-store';
import { updatePriceSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await request.json();
    const parsed = updatePriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cardId, price, date } = parsed.data;
    const saleDate = date || new Date().toISOString().split('T')[0];

    const updatedCard = await applyCardPatch(
      cardId,
      {
        price,
        priceDate: saleDate,
      },
      {
        id: adminCheck.session.user.githubId || adminCheck.session.user.githubLogin || 'admin',
        login: adminCheck.session.user.githubLogin,
      },
      { action: 'admin.update_price' }
    );

    return NextResponse.json({
      success: true,
      message: 'Price updated successfully',
      card: updatedCard,
    });
  } catch (error) {
    console.error('Error updating price:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
