import { asc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { auditLogs, getDb, hasDatabaseEnv, series, trackers } from '@/db';
import { revalidateHubCache, syncDomainRouteInRedis } from '@/lib/multi-tracker';
import { createTrackerSchema } from '@/lib/routing';
import { revalidateTrackerCache } from '@/lib/tracker-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  if (!hasDatabaseEnv()) {
    return NextResponse.json({ databaseConfigured: false, trackers: [] });
  }

  const db = getDb();
  const trackerRows = await db.select().from(trackers).orderBy(asc(trackers.createdAt));

  const enriched = await Promise.all(
    trackerRows.map(async (t) => {
      const seriesRows = await db
        .select()
        .from(series)
        .where(eq(series.trackerId, t.id))
        .orderBy(asc(series.sortOrder));
      return { ...t, series: seriesRows };
    })
  );

  return NextResponse.json({ databaseConfigured: true, trackers: enriched });
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  if (!hasDatabaseEnv()) {
    return NextResponse.json(
      { error: 'DATABASE_URL must be configured to create multi-tracker entries.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTrackerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const db = getDb();

  const [existing] = await db
    .select({ id: trackers.id })
    .from(trackers)
    .where(eq(trackers.slug, data.slug))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: `Tracker slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const [createdTracker] = await db
    .insert(trackers)
    .values({
      slug: data.slug,
      customDomain: data.customDomain ?? null,
      name: data.name,
      game: data.game,
      setName: data.setName,
      description: data.description,
      themeConfig: data.themeConfig,
      affiliateConfig: data.affiliateConfig,
      communityLinks: data.communityLinks,
      affiliateLinksEnabled: data.affiliateLinksEnabled,
      isPublished: data.isPublished,
    })
    .returning();

  const createdSeries = [];
  for (let i = 0; i < data.series.length; i++) {
    const s = data.series[i];
    const [row] = await db
      .insert(series)
      .values({
        trackerId: createdTracker.id,
        slug: s.slug,
        name: s.name,
        serialMin: s.serialMin,
        serialMax: s.serialMax,
        sortOrder: s.sortOrder ?? i,
      })
      .returning();
    createdSeries.push(row);
  }

  if (createdTracker.customDomain) {
    await syncDomainRouteInRedis(createdTracker.customDomain, createdTracker.slug);
  }

  const actorId = adminCheck.session.user.githubId || adminCheck.session.user.githubLogin || 'admin';
  await db.insert(auditLogs).values({
    actorId,
    actorLogin: adminCheck.session.user.githubLogin ?? null,
    action: 'tracker.create',
    entityType: 'tracker',
    entityId: createdTracker.id,
    beforeJson: null,
    afterJson: { ...createdTracker, series: createdSeries },
  });

  revalidateHubCache();
  revalidateTrackerCache(createdTracker.slug);

  return NextResponse.json(
    { success: true, tracker: { ...createdTracker, series: createdSeries } },
    { status: 201 }
  );
}
