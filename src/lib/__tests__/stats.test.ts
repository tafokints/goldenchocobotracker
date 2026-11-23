import { describe, expect, it } from 'vitest';
import {
  buildAdaptivePriceRanges,
  buildPopulationReport,
  computeCardStats,
  computeMedian,
} from '@/lib/stats';
import type { ResolvedCard } from '@/lib/types';

describe('computeMedian', () => {
  it('computes exact median for odd, even, and empty datasets', () => {
    expect(computeMedian([])).toBe(0);
    expect(computeMedian([100, 10, 50])).toBe(50);
    expect(computeMedian([10, 20, 40, 500])).toBe(30);
  });
});

describe('computeCardStats', () => {
  it('computes median vs mean, raw vs graded premium, cumulative curve, velocity, flips, and iconic watchlist', () => {
    const cards: ResolvedCard[] = [
      {
        id: 1,
        name: 'Golden Chocobo #01',
        found: true,
        foundBy: 'Alice',
        dateFound: '2025-06-20',
        pullChannel: 'lgs',
        region: 'US',
        price: 100000,
        priceDate: '2025-07-25',
        priceHistory: [
          { price: 50000, date: '2025-06-25' },
          { price: 100000, date: '2025-07-25' },
        ],
        grading: { service: 'PSA', grade: 10 },
        resolvedImage: '/images/chocobo-01.jpg',
      },
      {
        id: 2,
        name: 'Golden Chocobo #02',
        found: true,
        foundBy: 'Alice',
        dateFound: '2025-07-10',
        pullChannel: 'breaker',
        region: 'Japan',
        price: 50000,
        priceDate: '2025-07-12',
        priceHistory: [{ price: 50000, date: '2025-07-12' }],
        resolvedImage: null,
      },
      {
        id: 7,
        name: 'Golden Chocobo #07',
        found: false,
        priceHistory: [],
        resolvedImage: null,
      },
    ];

    const nowMs = new Date('2025-07-20').getTime();
    const stats = computeCardStats(cards, { nowMs });

    expect(stats.totalCards).toBe(3);
    expect(stats.foundCount).toBe(2);
    expect(stats.remainingCount).toBe(1);
    expect(stats.totalValue).toBe(150000);
    expect(stats.averagePrice).toBe(75000);
    expect(stats.medianPrice).toBe(75000);

    // Raw vs Graded premium: Graded ($100k) vs Raw ($50k) => +100%
    expect(stats.rawVsGraded.rawMedian).toBe(50000);
    expect(stats.rawVsGraded.gradedMedian).toBe(100000);
    expect(stats.rawVsGraded.gradedPremiumPct).toBe(100);

    // Cumulative discovery curve
    expect(stats.findsByMonth).toEqual([
      { month: '2025-06', count: 1, cumulative: 1 },
      { month: '2025-07', count: 1, cumulative: 2 },
    ]);

    // Velocity: 20 days between 2025-06-20 and 2025-07-10; 10 days since 2025-07-10
    expect(stats.discoveryVelocity.avgDaysBetweenPulls).toBe(20);
    expect(stats.discoveryVelocity.daysSinceLastPull).toBe(10);

    // Resale flip: #01 went $50k -> $100k (+100%)
    expect(stats.resaleFlips).toHaveLength(1);
    expect(stats.resaleFlips[0].cardId).toBe(1);
    expect(stats.resaleFlips[0].changePct).toBe(100);

    // Pull channel & region distributions
    expect(stats.pullChannelDistribution).toHaveLength(2);
    expect(stats.regionDistribution).toHaveLength(2);

    // Iconic watchlist includes #01 (found) within totalCards=3
    expect(stats.iconicWatchlist.some((i) => i.cardId === 1 && i.found)).toBe(true);
  });

  it('deduplicates identical (price, date) entries per card so resaleFlips has no fake 0% flips', () => {
    const cards: ResolvedCard[] = [
      {
        id: 1,
        name: 'Golden Chocobo #01',
        found: true,
        foundBy: 'CollectorA',
        dateFound: '2025-06-20',
        price: 1400000,
        priceDate: '2026-11-15',
        // Duplicate identical (price, date) rows — must NOT become a fake 0% resale flip
        priceHistory: [
          { price: 1400000, date: '2026-11-15', soldBy: 'Collectr' },
          { price: 1400000, date: '2026-11-15' },
        ],
        grading: { service: 'PSA', grade: 10, gradeLabel: 'MBA Gold Diamond' },
        resolvedImage: null,
      },
      {
        id: 2,
        name: 'Golden Chocobo #02',
        found: true,
        foundBy: 'CollectorB',
        dateFound: '2025-07-01',
        price: 65000,
        priceDate: '2025-10-23',
        // Real multi-sale history containing a duplicate (70000, 2025-09-14) AND two distinct $70k sales on different dates
        priceHistory: [
          { price: 70000, date: '2025-08-24' },
          { price: 70000, date: '2025-09-14' },
          { price: 70000, date: '2025-09-14' },
          { price: 65000, date: '2025-10-23' },
        ],
        grading: { service: 'CGC', grade: 10, gradeLabel: 'Pristine 10' },
        resolvedImage: null,
      },
      {
        id: 3,
        name: 'Golden Chocobo #03',
        found: true,
        foundBy: 'CollectorC',
        dateFound: '2025-08-24',
        price: 70000,
        priceDate: '2025-08-24',
        // Same (price, date) as card #02, but on a different card — must be preserved in stats.priceHistory
        priceHistory: [{ price: 70000, date: '2025-08-24' }],
        resolvedImage: null,
      },
    ];

    const stats = computeCardStats(cards, {
      iconicMap: { 1: 'First Print', 2: 'Runner-Up' },
    });

    // Only card #02 is a genuine multi-sale flip; card #01's duplicate rows do NOT produce a 0% flip
    expect(stats.resaleFlips).toHaveLength(1);
    expect(stats.resaleFlips[0].cardId).toBe(2);
    expect(stats.resaleFlips[0].salesCount).toBe(3);
    expect(stats.resaleFlips[0].firstPrice).toBe(70000);
    expect(stats.resaleFlips[0].latestPrice).toBe(65000);

    // Price history timeline should have 1 (#01) + 3 (#02) + 1 (#03) = 5 deduplicated entries
    expect(stats.priceHistory).toHaveLength(5);
    expect(stats.priceHistory.filter((e) => e.cardId === 1)).toHaveLength(1);
    expect(stats.priceHistory.filter((e) => e.cardId === 2)).toHaveLength(3);
    expect(stats.priceHistory.filter((e) => e.cardId === 3)).toHaveLength(1);

    // Iconic watchlist surfaces prestige gradeLabel formatting
    expect(stats.iconicWatchlist.find((i) => i.cardId === 1)?.gradingLabel).toBe(
      'PSA 10 · MBA Gold Diamond'
    );
    expect(stats.iconicWatchlist.find((i) => i.cardId === 2)?.gradingLabel).toBe(
      'CGC Pristine 10'
    );
  });
});

describe('buildAdaptivePriceRanges & buildPopulationReport', () => {
  it('adapts price range buckets to mid-five-figure lots without breaking high-value lots', () => {
    const oneRingRanges = buildAdaptivePriceRanges([7354, 7500, 7800, 15000, 19149]);
    expect(oneRingRanges).toEqual([
      { range: 'Under $5k', count: 0 },
      { range: '$5k–$10k', count: 3 },
      { range: '$10k–$15k', count: 0 },
      { range: '$15k–$20k', count: 2 },
      { range: '$20k+', count: 0 },
    ]);

    const chocoboRanges = buildAdaptivePriceRanges([45000, 75000, 250000]);
    expect(chocoboRanges.map((r) => r.range)).toEqual([
      'Under $25k',
      '$25k–$50k',
      '$50k–$100k',
      '$100k–$200k',
      '$200k+',
    ]);
  });

  it('groups slabs by service and tier using 3-digit padding for /100 trackers', () => {
    const cards: ResolvedCard[] = [
      {
        id: 16,
        name: 'The One Ring #016',
        found: true,
        priceHistory: [],
        grading: { service: 'BGS', grade: 10 },
        resolvedImage: null,
      },
      {
        id: 56,
        name: 'The One Ring #056',
        found: true,
        priceHistory: [],
        grading: { service: 'BGS', grade: 9.5 },
        resolvedImage: null,
      },
      {
        id: 63,
        name: 'The One Ring #063',
        found: true,
        priceHistory: [],
        grading: { service: 'PSA', grade: 10, gradeLabel: 'Gem Mint 10' },
        resolvedImage: null,
      },
    ];

    const pop = buildPopulationReport(cards, 3);
    expect(pop.totalGraded).toBe(3);
    expect(pop.groups.map((g) => g.service)).toEqual(['PSA', 'BGS']);
    expect(pop.groups[0].tiers[0].cards[0].paddedId).toBe('063');
    expect(pop.groups[1].tiers.map((t) => t.grade)).toEqual([10, 9.5]);
    expect(pop.groups[1].tiers[0].cards[0].paddedId).toBe('016');
  });
});
