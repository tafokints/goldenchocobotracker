import { describe, expect, it } from 'vitest';
import { computeCardStats } from '@/lib/stats';
import type { ResolvedCard } from '@/lib/types';

describe('computeCardStats', () => {
  it('computes overview metrics, price ranges, grading, and sorted timelines', () => {
    const cards: ResolvedCard[] = [
      {
        id: 1,
        name: 'Golden Chocobo #01',
        found: true,
        foundBy: 'Alice',
        dateFound: '2025-06-20',
        price: 50000,
        priceHistory: [{ price: 50000, date: '2025-07-25' }],
        grading: { service: 'PSA', grade: 10 },
        resolvedImage: '/images/chocobo-01.jpg',
      },
      {
        id: 2,
        name: 'Golden Chocobo #02',
        found: true,
        foundBy: 'Alice',
        dateFound: '2025-07-10',
        price: 80000,
        priceHistory: [{ price: 80000, date: '2025-07-12' }],
        grading: { service: 'BGS', grade: 9.5 },
        resolvedImage: null,
      },
      {
        id: 3,
        name: 'Golden Chocobo #03',
        found: false,
        priceHistory: [],
        resolvedImage: null,
      },
    ];

    const stats = computeCardStats(cards);
    expect(stats.totalCards).toBe(3);
    expect(stats.foundCount).toBe(2);
    expect(stats.totalValue).toBe(130000);
    expect(stats.averagePrice).toBe(65000);
    expect(stats.highestPrice).toBe(80000);
    expect(stats.lowestPrice).toBe(50000);
    expect(stats.gradingStats.totalGraded).toBe(2);
    expect(stats.gradingStats.averageGrade).toBe(9.75);
    expect(stats.topFinders[0]).toEqual({ finder: 'Alice', count: 2 });
    expect(stats.priceHistory.map((p) => p.date)).toEqual(['2025-07-12', '2025-07-25']);
  });
});
