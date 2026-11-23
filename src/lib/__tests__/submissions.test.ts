import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

const { mockRequireAdmin } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

import { GET as adminListSubmissions } from '@/app/api/admin/submissions/route';
import { POST as adminReviewSubmission } from '@/app/api/admin/submissions/[id]/route';
import { MAX_UPLOAD_BYTES, sanitizeUploadedImage } from '@/lib/r2';
import { extractClientIp, hashClientIp } from '@/lib/rate-limit';
import {
  isBotSubmission,
  publicSubmissionSchema,
  reviewSubmissionSchema,
} from '@/lib/submission-validation';

describe('community submission validation & anti-bot checks', () => {
  it('requires proof URL or uploaded photo and blocks XSS URLs', () => {
    const noProof = publicSubmissionSchema.safeParse({
      serialNumber: 4,
      submissionType: 'new_find',
      foundBy: 'Collector',
      dateFound: '2025-07-01',
    });
    expect(noProof.success).toBe(false);

    const xssProof = publicSubmissionSchema.safeParse({
      serialNumber: 4,
      submissionType: 'new_find',
      foundBy: 'Collector',
      dateFound: '2025-07-01',
      proofUrl: 'javascript:alert(1)',
    });
    expect(xssProof.success).toBe(false);

    const validFind = publicSubmissionSchema.safeParse({
      serialNumber: 4,
      submissionType: 'new_find',
      foundBy: 'Collector',
      dateFound: '2025-07-01',
      proofUrl: 'https://www.reddit.com/r/mtg/comments/abc123',
    });
    expect(validFind.success).toBe(true);
  });

  it('enforces type-specific required fields for sales, grading, photos, and corrections', () => {
    expect(
      publicSubmissionSchema.safeParse({
        serialNumber: 1,
        submissionType: 'price_sale',
        proofUrl: 'https://www.ebay.com/itm/123',
      }).success
    ).toBe(false);

    expect(
      publicSubmissionSchema.safeParse({
        serialNumber: 1,
        submissionType: 'price_sale',
        price: 75000,
        saleDate: '2026-01-10',
        proofUrl: 'https://www.ebay.com/itm/123',
      }).success
    ).toBe(true);

    expect(
      publicSubmissionSchema.safeParse({
        serialNumber: 1,
        submissionType: 'grading_update',
        gradingService: 'PSA',
        grade: 10,
        certNumber: '99887766',
        proofUrl: 'https://www.psacard.com/cert/99887766',
      }).success
    ).toBe(true);

    expect(
      publicSubmissionSchema.safeParse({
        serialNumber: 1,
        submissionType: 'photo_upload',
        proofUrl: 'https://example.com',
        hasPhotoUpload: false,
      }).success
    ).toBe(false);

    expect(
      publicSubmissionSchema.safeParse({
        serialNumber: 1,
        submissionType: 'photo_upload',
        hasPhotoUpload: true,
      }).success
    ).toBe(true);

    expect(
      publicSubmissionSchema.safeParse({
        serialNumber: 1,
        submissionType: 'correction',
        proofUrl: 'https://example.com/post',
        notes: 'Ownership transferred at MagicCon',
      }).success
    ).toBe(true);
  });

  it('detects honeypot fills and sub-2-second bot submissions', () => {
    const now = 1_700_000_010_000;
    expect(isBotSubmission({ honeypot: 'http://spam.example', nowMs: now }).blocked).toBe(true);
    expect(isBotSubmission({ formStartedAt: now - 500, nowMs: now }).blocked).toBe(true);
    expect(isBotSubmission({ honeypot: '', formStartedAt: now - 5000, nowMs: now }).blocked).toBe(
      false
    );
  });

  it('hashes client IPs irreversibly and parses x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.42, 10.0.0.1' });
    const ip = extractClientIp(headers);
    expect(ip).toBe('203.0.113.42');

    const hash = hashClientIp(ip);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain('203.0.113.42');
  });

  it('validates admin review payloads', () => {
    expect(reviewSubmissionSchema.safeParse({ decision: 'approve' }).success).toBe(true);
    expect(
      reviewSubmissionSchema.safeParse({ decision: 'reject', reviewNote: 'Unverified screenshot' })
        .success
    ).toBe(true);
    expect(reviewSubmissionSchema.safeParse({ decision: 'delete' }).success).toBe(false);
  });
});

describe('Cloudflare R2 image sanitization & EXIF stripping', () => {
  it('converts valid JPEG with EXIF into EXIF-free WebP', async () => {
    const jpegWithExif = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 214, g: 167, b: 61 } },
    })
      .jpeg()
      .withExif({ IFD0: { Make: 'SecretCamera', Model: 'GPS-Tracker' } })
      .toBuffer();

    const beforeMeta = await sharp(jpegWithExif).metadata();
    expect(beforeMeta.exif).toBeDefined();

    const result = await sanitizeUploadedImage(jpegWithExif);
    expect(result.contentType).toBe('image/webp');

    const afterMeta = await sharp(result.buffer).metadata();
    expect(afterMeta.format).toBe('webp');
    expect(afterMeta.exif).toBeUndefined();
  });

  it('rejects disguised HTML/SVG payloads and oversized buffers', async () => {
    const fakeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(sanitizeUploadedImage(fakeSvg)).rejects.toThrow();

    const fakeText = Buffer.from('not an image at all');
    await expect(sanitizeUploadedImage(fakeText)).rejects.toThrow();

    const hugeBuffer = Buffer.alloc(MAX_UPLOAD_BYTES + 1);
    await expect(sanitizeUploadedImage(hugeBuffer)).rejects.toThrow(/5 MB/i);
  });
});

describe('admin moderation endpoints enforce auth', () => {
  it('rejects unauthenticated GET /api/admin/submissions with 401', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/submissions');
    const res = await adminListSubmissions(req);
    expect(res.status).toBe(401);
  });

  it('rejects non-admin POST /api/admin/submissions/[id] with 403', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/submissions/sub-123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' }),
    });
    const res = await adminReviewSubmission(req, { params: Promise.resolve({ id: 'sub-123' }) });
    expect(res.status).toBe(403);
  });
});
