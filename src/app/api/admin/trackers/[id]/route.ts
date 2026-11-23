import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { auditLogs, getDb, hasDatabaseEnv, series, trackers } from '@/db';
import { revalidateHubCache, syncDomainRouteInRedis } from '@/lib/multi-tracker';
import { updateTrackerSchema } from '@/lib/routing';
import { revalidateTrackerCache } from '@/lib/tracker-store';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  if (!hasDatabaseEnv()) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateTrackerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const db = getDb();
  const [existing] = await db.select().from(trackers).where(eq(trackers.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Tracker not found' }, { status: 404 });
  }

  const data = parsed.data;
  const [updated] = await db
    .update(trackers)
    .set({
      customDomain: data.customDomain !== undefined ? (data.customDomain ?? null) : existing.customDomain,
      name: data.name ?? existing.name,
      game: data.game ?? existing.game,
      setName: data.setName ?? existing.setName,
      description: data.description ?? existing.description,
      themeConfig: data.themeConfig ?? existing.themeConfig,
      affiliateConfig: data.affiliateConfig ?? existing.affiliateConfig,
      communityLinks: data.communityLinks ?? existing.communityLinks,
      affiliateLinksEnabled:
        data.affiliateLinksEnabled !== undefined
          ? data.affiliateLinksEnabled
          : existing.affiliateLinksEnabled,
      isPublished: data.isPublished !== undefined ? data.isPublished : existing.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(trackers.id, id))
    .returning();

  if (data.addSeries && data.addSeries.length > 0) {
    for (const s of data.addSeries) {
      await db.insert(series).values({
        trackerId: id,
        slug: s.slug,
        name: s.name,
        serialMin: s.serialMin,
        serialMax: s.serialMax,
        sortOrder: s.sortOrder,
      });
    }
  }

  if (data.customDomain !== undefined) {
    await syncDomainRouteInRedis(updated.customDomain, updated.slug, existing.customDomain);
  }

  const actorId = adminCheck.session.user.githubId || adminCheck.session.user.githubLogin || 'admin';
  await db.insert(auditLogs).values({
    actorId,
    actorLogin: adminCheck.session.user.githubLogin ?? null,
    action: 'tracker.update',
    entityType: 'tracker',
    entityId: id,
    beforeJson: existing,
    afterJson: updated,
  });

  revalidateHubCache();
  revalidateTrackerCache(updated.slug);

  return NextResponse.json({ success: true, tracker: updated });
}
