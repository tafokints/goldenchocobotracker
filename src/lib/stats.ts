import type { ResolvedCard } from './types';

export interface ComputedStats {
  totalCards: number;
  foundCount: number;
  foundPercentage: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  totalValue: number;
  findsByMonth: Array<{ month: string; count: number }>;
  priceHistory: Array<{ date: string; price: number; cardId: number; label: string }>;
  gradingStats: {
    totalGraded: number;
    averageGrade: number;
    gradeDistribution: Array<{ grade: string; count: number }>;
    serviceDistribution: Array<{ service: string; count: number }>;
  };
  topFinders: Array<{ finder: string; count: number }>;
  recentDiscoveries: ResolvedCard[];
  highestPriced: ResolvedCard[];
  lowestPriced: ResolvedCard[];
  priceRanges: Array<{ range: string; count: number }>;
}

export function computeCardStats(cards: ResolvedCard[]): ComputedStats {
  const totalCards = cards.length || 77;
  const foundCards = cards.filter((c) => c.found);
  const gradedCards = foundCards.filter((c) => c.grading);

  if (foundCards.length === 0) {
    return {
      totalCards,
      foundCount: 0,
      foundPercentage: 0,
      averagePrice: 0,
      highestPrice: 0,
      lowestPrice: 0,
      totalValue: 0,
      findsByMonth: [],
      priceHistory: [],
      gradingStats: {
        totalGraded: 0,
        averageGrade: 0,
        gradeDistribution: [],
        serviceDistribution: [],
      },
      topFinders: [],
      recentDiscoveries: [],
      highestPriced: [],
      lowestPriced: [],
      priceRanges: [],
    };
  }

  const pricedCards = foundCards.filter((c): c is ResolvedCard & { price: number } => typeof c.price === 'number');
  const prices = pricedCards.map((c) => c.price);
  const totalValue = prices.reduce((a, b) => a + b, 0);
  const averagePrice = prices.length > 0 ? totalValue / prices.length : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const findsByMonthMap = foundCards.reduce<Record<string, number>>((acc, card) => {
    if (card.dateFound) {
      const parsed = new Date(card.dateFound);
      if (!Number.isNaN(parsed.getTime())) {
        const month = parsed.toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
      }
    }
    return acc;
  }, {});

  const findsByMonth = Object.entries(findsByMonthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const priceHistory = foundCards
    .flatMap((card) =>
      (card.priceHistory || []).map((entry) => ({
        date: entry.date,
        price: entry.price,
        cardId: card.id,
        label: `#${card.id.toString().padStart(2, '0')}`,
      }))
    )
    .filter((entry) => !Number.isNaN(new Date(entry.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const gradeDistributionMap = gradedCards.reduce<Record<string, number>>((acc, card) => {
    const grade = card.grading?.grade;
    if (grade !== undefined) {
      const key = grade.toString();
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const serviceDistributionMap = gradedCards.reduce<Record<string, number>>((acc, card) => {
    const service = card.grading?.service;
    if (service) {
      acc[service] = (acc[service] || 0) + 1;
    }
    return acc;
  }, {});

  const gradingStats = {
    totalGraded: gradedCards.length,
    averageGrade:
      gradedCards.length > 0
        ? gradedCards.reduce((sum, card) => sum + (card.grading?.grade || 0), 0) / gradedCards.length
        : 0,
    gradeDistribution: Object.entries(gradeDistributionMap)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade)),
    serviceDistribution: Object.entries(serviceDistributionMap)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count),
  };

  const finderCounts = foundCards.reduce<Record<string, number>>((acc, card) => {
    if (card.foundBy) {
      acc[card.foundBy] = (acc[card.foundBy] || 0) + 1;
    }
    return acc;
  }, {});

  const topFinders = Object.entries(finderCounts)
    .map(([finder, count]) => ({ finder, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentDiscoveries = [...foundCards]
    .filter((card) => Boolean(card.dateFound))
    .sort((a, b) => new Date(b.dateFound!).getTime() - new Date(a.dateFound!).getTime())
    .slice(0, 10);

  const highestPriced = [...pricedCards].sort((a, b) => b.price - a.price).slice(0, 5);
  const lowestPriced = [...pricedCards].sort((a, b) => a.price - b.price).slice(0, 5);

  const priceRanges = [
    { range: 'Under $10k', count: prices.filter((p) => p < 10000).length },
    { range: '$10k-$25k', count: prices.filter((p) => p >= 10000 && p < 25000).length },
    { range: '$25k-$50k', count: prices.filter((p) => p >= 25000 && p < 50000).length },
    { range: '$50k-$100k', count: prices.filter((p) => p >= 50000 && p < 100000).length },
    { range: '$100k+', count: prices.filter((p) => p >= 100000).length },
  ];

  return {
    totalCards,
    foundCount: foundCards.length,
    foundPercentage: (foundCards.length / totalCards) * 100,
    averagePrice,
    highestPrice,
    lowestPrice,
    totalValue,
    findsByMonth,
    priceHistory,
    gradingStats,
    topFinders,
    recentDiscoveries,
    highestPriced,
    lowestPriced,
    priceRanges,
  };
}
