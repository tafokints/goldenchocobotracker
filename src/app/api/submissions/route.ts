import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb, hasDatabaseEnv, submissions, type SubmissionPayload } from '@/db';
import { notifyDiscordNewSubmission } from '@/lib/discord';
import { hasR2Env, MAX_UPLOAD_BYTES, uploadQuarantinedImage } from '@/lib/r2';
import { checkSubmissionRateLimit, extractClientIp, hashClientIp } from '@/lib/rate-limit';
import { isBotSubmission, publicSubmissionSchema } from '@/lib/submission-validation';
import { DEFAULT_TRACKER_SLUG, getTrackerContextBySlug } from '@/lib/tracker-store';
import { verifyTurnstileToken } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

async function parseIncomingRequest(request: NextRequest): Promise<{
  fields: Record<string, unknown>;
  photoFile: File | null;
}> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const fields: Record<string, unknown> = {};
    let photoFile: File | null = null;

    for (const [key, value] of formData.entries()) {
      if (key === 'photo' && value instanceof File && value.size > 0) {
        photoFile = value;
      } else if (typeof value === 'string') {
        fields[key] = value;
      }
    }

    fields.hasPhotoUpload = Boolean(photoFile);
    return { fields, photoFile };
  }

  const json = (await request.json()) as Record<string, unknown>;
  return { fields: { ...json, hasPhotoUpload: false }, photoFile: null };
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseEnv()) {
    return NextResponse.json(
      { error: 'Community submissions are being configured and will open shortly.' },
      { status: 503 }
    );
  }

  const clientIp = extractClientIp(request.headers);
  const ipHash = hashClientIp(clientIp);

  const rateLimit = await checkSubmissionRateLimit(ipHash);
  if (!rateLimit.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: rateLimit.reason || 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSec) },
      }
    );
  }

  let parsedBody: { fields: Record<string, unknown>; photoFile: File | null };
  try {
    parsedBody = await parseIncomingRequest(request);
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  const { fields, photoFile } = parsedBody;

  const botCheck = isBotSubmission({
    honeypot: typeof fields.honeypot === 'string' ? fields.honeypot : undefined,
    formStartedAt:
      fields.formStartedAt !== undefined && fields.formStartedAt !== ''
        ? Number(fields.formStartedAt)
        : undefined,
  });

  if (botCheck.blocked) {
    return NextResponse.json(
      { error: 'Submission rejected by automated spam check. Please wait a moment and try again.' },
      { status: 400 }
    );
  }

  const turnstileResult = await verifyTurnstileToken(
    typeof fields.turnstileToken === 'string' ? fields.turnstileToken : undefined,
    clientIp
  );

  if (!turnstileResult.ok) {
    return NextResponse.json(
      { error: turnstileResult.error || 'Bot verification failed.' },
      { status: 400 }
    );
  }

  const validated = publicSubmissionSchema.safeParse(fields);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'Please check the highlighted fields and try again.',
        details: validated.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = validated.data;
  const trackerSlug = data.trackerSlug || DEFAULT_TRACKER_SLUG;
  const ctx = await getTrackerContextBySlug(trackerSlug);

  if (!ctx || ctx.seriesList.length === 0) {
    return NextResponse.json({ error: 'Tracker not found.' }, { status: 404 });
  }

  const targetSeries = data.seriesSlug
    ? ctx.seriesList.find((s) => s.slug === data.seriesSlug)
    : ctx.seriesList[0];

  if (!targetSeries) {
    return NextResponse.json({ error: 'Series not found for this tracker.' }, { status: 404 });
  }

  if (data.serialNumber < targetSeries.serialMin || data.serialNumber > targetSeries.serialMax) {
    return NextResponse.json(
      {
        error: `Serial number must be between ${targetSeries.serialMin} and ${targetSeries.serialMax}.`,
      },
      { status: 400 }
    );
  }

  const db = getDb();

  // Deduplicate pending submissions for the same card & submission type
  const [duplicate] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.seriesId, targetSeries.id),
        eq(submissions.serialNumber, data.serialNumber),
        eq(submissions.submissionType, data.submissionType),
        eq(submissions.status, 'pending')
      )
    )
    .limit(1);

  if (duplicate) {
    return NextResponse.json(
      {
        error:
          'A similar update for this card is already in the moderation queue. Thank you for checking!',
      },
      { status: 409 }
    );
  }

  const submissionId = crypto.randomUUID();
  let proofImageKey: string | null = null;

  if (photoFile) {
    if (photoFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Photo exceeds maximum allowed size of 5 MB.' },
        { status: 400 }
      );
    }

    if (!hasR2Env()) {
      return NextResponse.json(
        {
          error:
            'Photo uploads are not enabled yet on this server. Please submit a proof link instead.',
        },
        { status: 503 }
      );
    }

    try {
      const arrayBuf = await photoFile.arrayBuffer();
      proofImageKey = await uploadQuarantinedImage(Buffer.from(arrayBuf), submissionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid photo upload.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const payloadJson: SubmissionPayload = {
    foundBy: data.foundBy,
    dateFound: data.dateFound,
    sourceUrl: data.sourceUrl || (data.submissionType === 'new_find' ? data.proofUrl : undefined),
    marketplaceUrl: data.marketplaceUrl,
    marketplaceLabel: data.marketplaceLabel,
    price: data.price,
    saleDate: data.saleDate,
    platform: data.platform,
    soldBy: data.soldBy,
    soldTo: data.soldTo,
    gradingService: data.gradingService,
    grade: data.grade,
    certNumber: data.certNumber,
    dateGraded: data.dateGraded,
    notes: data.notes,
  };

  await db.insert(submissions).values({
    id: submissionId,
    trackerId: ctx.tracker.id,
    seriesId: targetSeries.id,
    serialNumber: data.serialNumber,
    submissionType: data.submissionType,
    payloadJson,
    proofUrl: data.proofUrl ?? data.sourceUrl ?? null,
    proofImageKey,
    submitterHandle: data.submitterHandle ?? null,
    submitterIpHash: ipHash,
    status: 'pending',
  });

  await notifyDiscordNewSubmission({
    submissionId,
    trackerName: ctx.tracker.name,
    seriesName: targetSeries.name,
    serialNumber: data.serialNumber,
    serialMax: targetSeries.serialMax,
    submissionType: data.submissionType,
    payload: payloadJson,
    proofUrl: data.proofUrl ?? data.sourceUrl ?? null,
    hasPhotoUpload: Boolean(proofImageKey),
    submitterHandle: data.submitterHandle ?? null,
  });

  return NextResponse.json(
    {
      success: true,
      submissionId,
      message:
        'Thank you! Your submission is in our moderation queue and typically goes live within 24 hours.',
    },
    { status: 201 }
  );
}
