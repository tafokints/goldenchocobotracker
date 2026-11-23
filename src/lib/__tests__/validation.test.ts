import { describe, expect, it } from 'vitest';
import { COMMON_GRADE_LABELS, formatGradingDisplay } from '@/lib/grading';
import { publicSubmissionSchema, reviewSubmissionSchema } from '@/lib/submission-validation';
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

  it('validates optional gradeLabel on admin grading, public submissions, and review overrides', () => {
    const validAdmin = updateGradingSchema.safeParse({
      cardId: 47,
      grading: {
        service: 'PSA',
        grade: 10,
        gradeLabel: '  MBA Gold Diamond  ',
        certNumber: '123870076',
      },
    });
    expect(validAdmin.success).toBe(true);
    if (validAdmin.success) {
      expect(validAdmin.data.grading.gradeLabel).toBe('MBA Gold Diamond');
    }

    const blankAdmin = updateGradingSchema.safeParse({
      cardId: 47,
      grading: { service: 'PSA', grade: 8, gradeLabel: '   ' },
    });
    expect(blankAdmin.success).toBe(true);
    if (blankAdmin.success) {
      expect(blankAdmin.data.grading.gradeLabel).toBeUndefined();
    }

    const tooLongAdmin = updateGradingSchema.safeParse({
      cardId: 47,
      grading: { service: 'CGC', grade: 10, gradeLabel: 'x'.repeat(61) },
    });
    expect(tooLongAdmin.success).toBe(false);

    const validPublicSub = publicSubmissionSchema.safeParse({
      serialNumber: 12,
      submissionType: 'grading_update',
      gradingService: 'CGC',
      grade: 10,
      gradeLabel: ' Pristine 10 ',
      proofUrl: 'https://www.cgccards.com/certlookup/123456/',
    });
    expect(validPublicSub.success).toBe(true);
    if (validPublicSub.success) {
      expect(validPublicSub.data.gradeLabel).toBe('Pristine 10');
    }

    const tooLongPublicSub = publicSubmissionSchema.safeParse({
      serialNumber: 12,
      submissionType: 'grading_update',
      gradingService: 'BGS',
      grade: 10,
      gradeLabel: 'y'.repeat(61),
      proofUrl: 'https://www.beckett.com/grading/card-lookup',
    });
    expect(tooLongPublicSub.success).toBe(false);

    const validReview = reviewSubmissionSchema.safeParse({
      decision: 'approve',
      overrides: {
        gradingService: 'BGS',
        grade: 10,
        gradeLabel: 'Black Label 10',
      },
    });
    expect(validReview.success).toBe(true);
    if (validReview.success) {
      expect(validReview.data.overrides?.gradeLabel).toBe('Black Label 10');
    }
  });
});

describe('formatGradingDisplay', () => {
  it('formats prestige slab tiers, add-on designations, and plain grades cleanly', () => {
    expect(formatGradingDisplay({ service: 'CGC', grade: 10, gradeLabel: 'Pristine 10' })).toBe(
      'CGC Pristine 10'
    );
    expect(formatGradingDisplay({ service: 'CGC', grade: 10, gradeLabel: 'Pristine' })).toBe(
      'CGC Pristine 10'
    );
    expect(formatGradingDisplay({ service: 'BGS', grade: 10, gradeLabel: 'Black Label 10' })).toBe(
      'BGS Black Label 10'
    );
    expect(formatGradingDisplay({ service: 'BGS', grade: 10, gradeLabel: 'Black Label' })).toBe(
      'BGS Black Label 10'
    );
    expect(formatGradingDisplay({ service: 'PSA', grade: 10, gradeLabel: 'Gem Mint 10' })).toBe(
      'PSA Gem Mint 10'
    );
    expect(
      formatGradingDisplay({ service: 'PSA', grade: 10, gradeLabel: 'MBA Gold Diamond' })
    ).toBe('PSA 10 · MBA Gold Diamond');
    expect(formatGradingDisplay({ service: 'PSA', grade: 8 })).toBe('PSA 8');
    expect(formatGradingDisplay({ service: 'PSA', grade: 8, gradeLabel: '   ' })).toBe('PSA 8');
    expect(
      formatGradingDisplay({ service: 'CGC', grade: 10, gradeLabel: 'CGC Pristine 10' })
    ).toBe('CGC Pristine 10');
    expect(formatGradingDisplay(null)).toBe('');
    expect(formatGradingDisplay(undefined)).toBe('');
    expect(COMMON_GRADE_LABELS).toContain('Pristine 10');
    expect(COMMON_GRADE_LABELS).toContain('Black Label 10');
    expect(COMMON_GRADE_LABELS).toContain('Gem Mint 10');
    expect(COMMON_GRADE_LABELS).toContain('MBA Gold Diamond');
  });
});
