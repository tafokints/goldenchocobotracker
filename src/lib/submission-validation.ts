import { z } from 'zod';
import { isoDateSchema, optionalSafeHttpUrlSchema } from '@/lib/validation';

export const MIN_FORM_FILL_MS = 2000;

export const submissionTypeSchema = z.enum([
  'new_find',
  'price_sale',
  'grading_update',
  'photo_upload',
  'correction',
]);

const optionalShortText = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .optional()
    .transform((v) => (v ? v : undefined));

export const publicSubmissionSchema = z
  .object({
    trackerSlug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/)
      .default('golden-chocobo'),
    seriesSlug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    serialNumber: z.coerce.number().int().min(1).max(100_000),
    submissionType: submissionTypeSchema,
    proofUrl: optionalSafeHttpUrlSchema,
    submitterHandle: optionalShortText(80),
    hasPhotoUpload: z.boolean().default(false),
    // Anti-bot fields
    honeypot: z.string().optional().default(''),
    formStartedAt: z.coerce.number().optional(),
    turnstileToken: z.string().optional(),
    // Structured payload fields
    foundBy: optionalShortText(120),
    dateFound: z
      .union([z.literal(''), isoDateSchema])
      .optional()
      .transform((v) => (v ? v : undefined)),
    sourceUrl: optionalSafeHttpUrlSchema,
    marketplaceUrl: optionalSafeHttpUrlSchema,
    marketplaceLabel: optionalShortText(60),
    price: z
      .union([z.literal(''), z.coerce.number().finite().min(0).max(10_000_000)])
      .optional()
      .transform((v) => (typeof v === 'number' ? v : undefined)),
    saleDate: z
      .union([z.literal(''), isoDateSchema])
      .optional()
      .transform((v) => (v ? v : undefined)),
    platform: optionalShortText(60),
    soldBy: optionalShortText(120),
    soldTo: optionalShortText(120),
    gradingService: optionalShortText(40),
    grade: z
      .union([z.literal(''), z.coerce.number().finite().min(0).max(10)])
      .optional()
      .transform((v) => (typeof v === 'number' ? v : undefined)),
    certNumber: optionalShortText(40),
    dateGraded: z
      .union([z.literal(''), isoDateSchema])
      .optional()
      .transform((v) => (v ? v : undefined)),
    notes: optionalShortText(1000),
  })
  .superRefine((data, ctx) => {
    const hasProof = Boolean(data.proofUrl || data.sourceUrl || data.hasPhotoUpload);
    if (!hasProof) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proofUrl'],
        message: 'Please provide a proof link (https://...) or upload a proof photo.',
      });
    }

    switch (data.submissionType) {
      case 'new_find':
        if (!data.foundBy) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['foundBy'],
            message: 'Finder name or handle is required for a new discovery.',
          });
        }
        if (!data.dateFound) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dateFound'],
            message: 'Discovery date is required.',
          });
        }
        break;
      case 'price_sale':
        if (data.price === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['price'],
            message: 'Sale price is required.',
          });
        }
        if (!data.saleDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['saleDate'],
            message: 'Sale date is required.',
          });
        }
        break;
      case 'grading_update':
        if (!data.gradingService) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['gradingService'],
            message: 'Grading service (e.g., PSA, BGS, CGC) is required.',
          });
        }
        if (data.grade === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grade'],
            message: 'Numeric grade (0–10) is required.',
          });
        }
        break;
      case 'photo_upload':
        if (!data.hasPhotoUpload) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['hasPhotoUpload'],
            message: 'Please attach a photo for a photo upload submission.',
          });
        }
        break;
      case 'correction':
        if (!data.notes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['notes'],
            message: 'Please describe the correction or ownership change.',
          });
        }
        break;
    }
  });

export function isBotSubmission(input: {
  honeypot?: string;
  formStartedAt?: number;
  nowMs?: number;
}): { blocked: boolean; reason?: string } {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { blocked: true, reason: 'honeypot' };
  }

  if (typeof input.formStartedAt === 'number' && Number.isFinite(input.formStartedAt)) {
    const elapsed = (input.nowMs ?? Date.now()) - input.formStartedAt;
    if (elapsed < MIN_FORM_FILL_MS) {
      return { blocked: true, reason: 'too_fast' };
    }
  }

  return { blocked: false };
}

export const reviewSubmissionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reviewNote: optionalShortText(500),
  /** Optional admin edits applied before approval */
  overrides: z
    .object({
      foundBy: optionalShortText(120),
      dateFound: z
        .union([z.literal(''), isoDateSchema])
        .optional()
        .transform((v) => (v ? v : undefined)),
      sourceUrl: optionalSafeHttpUrlSchema,
      marketplaceUrl: optionalSafeHttpUrlSchema,
      marketplaceLabel: optionalShortText(60),
      price: z
        .union([z.literal(''), z.coerce.number().finite().min(0).max(10_000_000)])
        .optional()
        .transform((v) => (typeof v === 'number' ? v : undefined)),
      saleDate: z
        .union([z.literal(''), isoDateSchema])
        .optional()
        .transform((v) => (v ? v : undefined)),
      soldBy: optionalShortText(120),
      soldTo: optionalShortText(120),
      gradingService: optionalShortText(40),
      grade: z
        .union([z.literal(''), z.coerce.number().finite().min(0).max(10)])
        .optional()
        .transform((v) => (typeof v === 'number' ? v : undefined)),
      certNumber: optionalShortText(40),
      dateGraded: z
        .union([z.literal(''), isoDateSchema])
        .optional()
        .transform((v) => (v ? v : undefined)),
      notes: optionalShortText(1000),
    })
    .optional(),
});
