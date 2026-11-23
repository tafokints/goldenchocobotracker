import { NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { applyCardPatch } from '@/lib/tracker-store';
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

    const {
      cardId,
      foundBy,
      dateFound,
      pullChannel,
      region,
      link,
      sourceUrl,
      marketplaceUrl,
      marketplaceLabel,
    } = parsed.data;

    const updatedCard = await applyCardPatch(
      cardId,
      {
        found: true,
        foundBy,
        dateFound,
        pullChannel,
        region,
        sourceUrl: sourceUrl ?? link,
        marketplaceUrl,
        marketplaceLabel,
      },
      {
        id: adminCheck.session.user.githubId || adminCheck.session.user.githubLogin || 'admin',
        login: adminCheck.session.user.githubLogin,
      },
      { action: 'admin.submit_discovery' }
    );

    return NextResponse.json({
      success: true,
      message: 'Card updated successfully',
      card: updatedCard,
    });
  } catch (error) {
    console.error('Error processing card submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
