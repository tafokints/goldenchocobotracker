import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import {
  getDb,
  hasDatabaseEnv,
  serialItems,
  series,
  submissions,
  trackers,
  type SubmissionStatus,
} from '@/db';
import { getQuarantinedImagePreviewUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  if (!hasDatabaseEnv()) {
    return NextResponse.json({
      databaseConfigured: false,
      submissions: [],
    });
  }

  const statusParam = request.nextUrl.searchParams.get('status') || 'pending';
  const db = getDb();

  const rows =
    statusParam === 'all'
      ? await db
          .select({
            submission: submissions,
            trackerName: trackers.name,
            trackerSlug: trackers.slug,
            seriesName: series.name,
            seriesMax: series.serialMax,
          })
          .from(submissions)
          .innerJoin(trackers, eq(submissions.trackerId, trackers.id))
          .innerJoin(series, eq(submissions.seriesId, series.id))
          .orderBy(desc(submissions.createdAt))
          .limit(100)
      : await db
          .select({
            submission: submissions,
            trackerName: trackers.name,
            trackerSlug: trackers.slug,
            seriesName: series.name,
            seriesMax: series.serialMax,
          })
          .from(submissions)
          .innerJoin(trackers, eq(submissions.trackerId, trackers.id))
          .innerJoin(series, eq(submissions.seriesId, series.id))
          .where(eq(submissions.status, statusParam as SubmissionStatus))
          .orderBy(desc(submissions.createdAt))
          .limit(100);

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const [currentItem] = await db
        .select()
        .from(serialItems)
        .where(eq(serialItems.seriesId, row.submission.seriesId))
        .then((items) =>
          items.filter((item) => item.serialNumber === row.submission.serialNumber)
        );

      const previewImageUrl = row.submission.proofImageKey
        ? await getQuarantinedImagePreviewUrl(row.submission.proofImageKey)
        : null;

      return {
        ...row.submission,
        trackerName: row.trackerName,
        trackerSlug: row.trackerSlug,
        seriesName: row.seriesName,
        seriesMax: row.seriesMax,
        previewImageUrl,
        currentItem: currentItem ?? null,
      };
    })
  );

  return NextResponse.json({
    databaseConfigured: true,
    submissions: enriched,
  });
}
