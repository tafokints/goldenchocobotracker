import { z } from 'zod';

export const TOTAL_CHOCOBO_CARDS = 77;

export const cardIdSchema = z.coerce
  .number()
  .int('Card ID must be an integer')
  .min(1, 'Card ID must be between 1 and 77')
  .max(TOTAL_CHOCOBO_CARDS, 'Card ID must be between 1 and 77');

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD');

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'URL must start with http:// or https://' }
  );

export const optionalSafeHttpUrlSchema = z
  .union([z.literal(''), safeHttpUrlSchema])
  .optional()
  .transform((val) => (val ? val : undefined));

export const safeImageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Image URL is required')
  .max(2048, 'Image URL is too long')
  .refine(
    (val) => {
      if (val.startsWith('/')) {
        // Prevent protocol-relative URLs (//evil.com) and directory traversal (..)
        return !val.startsWith('//') && !val.includes('..') && /^\/[a-zA-Z0-9/_\-.]+$/.test(val);
      }
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'Image URL must be a safe relative path (/images/...) or http(s) URL' }
  );

export const pullChannelSchema = z
  .enum(['lgs', 'personal_box', 'breaker', 'retail', 'gift_bundle', 'unknown'])
  .optional();

export const submitCardSchema = z.object({
  cardId: cardIdSchema,
  foundBy: z.string().trim().min(1, 'Found By is required').max(120, 'Found By is too long'),
  dateFound: isoDateSchema,
  pullChannel: z
    .union([z.literal(''), z.enum(['lgs', 'personal_box', 'breaker', 'retail', 'gift_bundle', 'unknown'])])
    .optional()
    .transform((v) => (v ? v : undefined)),
  region: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : undefined)),
  link: optionalSafeHttpUrlSchema,
  sourceUrl: optionalSafeHttpUrlSchema,
  marketplaceUrl: optionalSafeHttpUrlSchema,
  marketplaceLabel: z.string().trim().max(60).optional(),
});

export const updatePriceSchema = z.object({
  cardId: cardIdSchema,
  price: z.coerce
    .number()
    .finite('Price must be a valid number')
    .min(0, 'Price cannot be negative')
    .max(10_000_000, 'Price exceeds reasonable maximum'),
  date: isoDateSchema.optional(),
});

export const updateImageSchema = z.object({
  cardId: cardIdSchema,
  imageUrl: safeImageUrlSchema,
});

export const updateGradingSchema = z.object({
  cardId: cardIdSchema,
  grading: z.object({
    service: z.string().trim().min(1, 'Grading service is required').max(40),
    grade: z.coerce.number().finite().min(0).max(10),
    gradeLabel: z
      .string()
      .trim()
      .max(60, 'Grade label is too long')
      .optional()
      .transform((v) => (v ? v : undefined)),
    dateGraded: z.union([z.literal(''), isoDateSchema]).optional().transform((v) => v || undefined),
    certNumber: z.string().trim().max(40).optional().transform((v) => v || undefined),
  }),
});

export const addPriceHistorySchema = z.object({
  cardId: cardIdSchema,
  entry: z.object({
    price: z.coerce.number().finite().min(0).max(10_000_000),
    date: isoDateSchema,
    soldBy: z.string().trim().max(120).optional().transform((v) => v || undefined),
    soldTo: z.string().trim().max(120).optional().transform((v) => v || undefined),
    sourceUrl: optionalSafeHttpUrlSchema,
  }),
});
