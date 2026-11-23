import { describe, expect, it } from 'vitest';
import { computeCardStats, computeMedian } from '@/lib/stats';
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
});
