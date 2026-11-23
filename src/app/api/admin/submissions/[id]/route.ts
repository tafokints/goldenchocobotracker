import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/auth';
import { auditLogs, getDb, hasDatabaseEnv, submissions, trackers, type SubmissionPayload } from '@/db';
import { notifyDiscordPublicMilestone } from '@/lib/discord';
import { deleteQuarantinedImage, promoteQuarantinedImage } from '@/lib/r2';
import { reviewSubmissionSchema } from '@/lib/submission-validation';
import { applyCardPatch, getCardsFresh, type UpsertSerialPatch } from '@/lib/tracker-store';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  if (!hasDatabaseEnv()) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = reviewSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid review payload', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const db = getDb();
  const [row] = await db
    .select({
      submission: submissions,
      trackerSlug: trackers.slug,
      trackerName: trackers.name,
    })
    .from(submissions)
    .innerJoin(trackers, eq(submissions.trackerId, trackers.id))
    .where(eq(submissions.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  if (row.submission.status !== 'pending') {
    return NextResponse.json(
      { error: `Submission has already been ${row.submission.status}.` },
      { status: 409 }
    );
  }

  const actorId = adminCheck.session.user.githubId || adminCheck.session.user.githubLogin || 'admin';
  const actorLogin = adminCheck.session.user.githubLogin || adminCheck.session.user.name || 'admin';

  if (parsed.data.decision === 'reject') {
    if (row.submission.proofImageKey) {
      await deleteQuarantinedImage(row.submission.proofImageKey);
    }

    const [updated] = await db
      .update(submissions)
      .set({
        status: 'rejected',
        reviewedBy: actorLogin,
        reviewNote: parsed.data.reviewNote ?? null,
        reviewedAt: new Date(),
      })
      .where(eq(submissions.id, id))
      .returning();

    await db.insert(auditLogs).values({
      actorId,
      actorLogin,
      action: 'submission.reject',
      entityType: 'submission',
      entityId: id,
      beforeJson: row.submission,
      afterJson: updated,
    });

    return NextResponse.json({ success: true, submission: updated });
  }

  // Approve decision: merge submitted payload + any admin edits
  const merged: SubmissionPayload = {
    ...row.submission.payloadJson,
    ...(parsed.data.overrides || {}),
  };

  let promotedImageUrl: string | undefined;
  if (row.submission.proofImageKey) {
    promotedImageUrl = await promoteQuarantinedImage(
      row.submission.proofImageKey,
      row.trackerSlug,
      row.submission.serialNumber
    );
  }

  const patch: UpsertSerialPatch = {
    found: row.submission.submissionType === 'new_find' ? true : undefined,
    foundBy: merged.foundBy,
    dateFound: merged.dateFound,
    pullChannel: merged.pullChannel,
    region: merged.region,
    sourceUrl: merged.sourceUrl,
    marketplaceUrl: merged.marketplaceUrl,
    marketplaceLabel: merged.marketplaceLabel,
    imageUrl: promotedImageUrl,
    notes: merged.notes,
  };

  if (merged.price !== undefined) {
    const saleDate = merged.saleDate || new Date().toISOString().split('T')[0];
    patch.addPriceHistoryEntry = {
      price: merged.price,
      date: saleDate,
      soldBy: merged.soldBy,
      soldTo: merged.soldTo,
      sourceUrl: row.submission.proofUrl ?? undefined,
    };
  }

  if (merged.gradingService && merged.grade !== undefined) {
    patch.grading = {
      service: merged.gradingService,
      grade: merged.grade,
      certNumber: merged.certNumber,
      dateGraded: merged.dateGraded,
    };
  }

  const updatedCard = await applyCardPatch(
    row.submission.serialNumber,
    patch,
    { id: actorId, login: actorLogin },
    {
      trackerSlug: row.trackerSlug,
      seriesId: row.submission.seriesId,
      action: 'submission.approve',
    }
  );

  const [updatedSubmission] = await db
    .update(submissions)
    .set({
      status: 'approved',
      reviewedBy: actorLogin,
      reviewNote: parsed.data.reviewNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(submissions.id, id))
    .returning();

  await db.insert(auditLogs).values({
    actorId,
    actorLogin,
    action: 'submission.approve',
    entityType: 'submission',
    entityId: id,
    beforeJson: row.submission,
    afterJson: updatedSubmission,
  });

  if (process.env.DISCORD_PUBLIC_ANNOUNCEMENTS_WEBHOOK_URL) {
    const allCards = await getCardsFresh();
    await notifyDiscordPublicMilestone({
      trackerSlug: row.trackerSlug,
      trackerName: row.trackerName,
      serialNumber: row.submission.serialNumber,
      totalCards: allCards.length || 77,
      foundCount: allCards.filter((c) => c.found).length,
      submissionType: row.submission.submissionType,
      foundBy: merged.foundBy,
      price: merged.price,
      gradingLabel:
        merged.gradingService && merged.grade !== undefined
          ? `${merged.gradingService} ${merged.grade}`
          : undefined,
    });
  }

  return NextResponse.json({
    success: true,
    submission: updatedSubmission,
    card: updatedCard,
  });
}
