import { describe, expect, it } from 'vitest';
import {
  addPriceHistorySchema,
  submitCardSchema,
  updateGradingSchema,
  updateImageSchema,
  updatePriceSchema,
} from '@/lib/validation';

describe('validation schemas', () => {
  it('blocks javascript: and data: XSS URLs on submitCardSchema', () => {
    const badSubmit = submitCardSchema.safeParse({
      cardId: 1,
      foundBy: 'Collector',
      dateFound: '2025-07-01',
      sourceUrl: 'javascript:alert(1)',
    });
    expect(badSubmit.success).toBe(false);

    const badDataUrl = submitCardSchema.safeParse({
      cardId: 1,
      foundBy: 'Collector',
      dateFound: '2025-07-01',
      marketplaceUrl: 'data:text/html,<script>alert(1)</script>',
    });
    expect(badDataUrl.success).toBe(false);
  });

  it('accepts valid discovery payloads with separated source and marketplace URLs', () => {
    const valid = submitCardSchema.safeParse({
      cardId: '04',
      foundBy: 'hin3033',
      dateFound: '2025-06-15',
      sourceUrl: 'https://www.instagram.com/p/abc123/',
      marketplaceUrl: 'https://www.ebay.com/itm/406051967653',
      marketplaceLabel: 'eBay',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.cardId).toBe(4);
    }
  });

  it('enforces card ID bounds 1..77', () => {
    expect(updatePriceSchema.safeParse({ cardId: 0, price: 1000 }).success).toBe(false);
    expect(updatePriceSchema.safeParse({ cardId: 78, price: 1000 }).success).toBe(false);
    expect(updatePriceSchema.safeParse({ cardId: 77, price: 50000 }).success).toBe(true);
  });

  it('blocks negative prices and path traversal on image updates', () => {
    expect(updatePriceSchema.safeParse({ cardId: 1, price: -5 }).success).toBe(false);
    expect(updateImageSchema.safeParse({ cardId: 1, imageUrl: '//evil.com/x.jpg' }).success).toBe(false);
    expect(updateImageSchema.safeParse({ cardId: 1, imageUrl: '/images/../secret.txt' }).success).toBe(false);
    expect(updateImageSchema.safeParse({ cardId: 1, imageUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(updateImageSchema.safeParse({ cardId: 1, imageUrl: '/images/chocobo-01.jpg' }).success).toBe(true);
    expect(updateImageSchema.safeParse({ cardId: 1, imageUrl: 'https://cdn.example.com/card.webp' }).success).toBe(true);
  });

  it('validates grading bounds and price history dates', () => {
    expect(
      updateGradingSchema.safeParse({
        cardId: 10,
        grading: { service: 'PSA', grade: 10, certNumber: '12345678', dateGraded: '2025-08-01' },
      }).success
    ).toBe(true);

    expect(
      updateGradingSchema.safeParse({
        cardId: 10,
        grading: { service: 'PSA', grade: 11 },
      }).success
    ).toBe(false);

    expect(
      addPriceHistorySchema.safeParse({
        cardId: 1,
        entry: { price: 65000, date: '08/01/2025' },
      }).success
    ).toBe(false);

    expect(
      addPriceHistorySchema.safeParse({
        cardId: 1,
        entry: { price: 65000, date: '2025-08-01', soldBy: 'Alice', soldTo: 'Bob' },
      }).success
    ).toBe(true);
  });
});
