import { GOLDEN_CHOCOBO_ICONIC_NUMBERS } from '@/lib/iconic-numbers';
import { PULL_CHANNEL_LABELS, type ResolvedCard } from './types';

export interface IconicWatchItem {
  cardId: number;
  paddedId: string;
  label: string;
  found: boolean;
  foundBy?: string;
  dateFound?: string;
  price?: number;
  gradingLabel?: string;
}

export interface ResaleFlipItem {
  cardId: number;
  paddedId: string;
  firstPrice: number;
  firstDate: string;
  latestPrice: number;
  latestDate: string;
  changePct: number;
  salesCount: number;
}

export interface ComputedStats {
  totalCards: number;
  foundCount: number;
  remainingCount: number;
  foundPercentage: number;
  pricedCount: number;
  averagePrice: number;
  medianPrice: number;
  highestPrice: number;
  lowestPrice: number;
  totalValue: number;
  rawVsGraded: {
    rawCount: number;
    rawAverage: number;
    rawMedian: number;
    gradedCount: number;
    gradedAverage: number;
    gradedMedian: number;
    gradedPremiumPct: number | null;
  };
  discoveryVelocity: {
    avgDaysBetweenPulls: number | null;
    daysSinceLastPull: number | null;
    firstPullDate: string | null;
    latestPullDate: string | null;
  };
  findsByMonth: Array<{ month: string; count: number; cumulative: number }>;
  priceHistory: Array<{ date: string; price: number; cardId: number; label: string }>;
  gradingStats: {
    totalGraded: number;
    averageGrade: number;
    gradeDistribution: Array<{ grade: string; count: number }>;
    serviceDistribution: Array<{ service: string; count: number }>;
  };
  pullChannelDistribution: Array<{ channel: string; count: number }>;
  regionDistribution: Array<{ region: string; count: number }>;
  iconicWatchlist: IconicWatchItem[];
  resaleFlips: ResaleFlipItem[];
  topFinders: Array<{ finder: string; count: number }>;
  recentDiscoveries: ResolvedCard[];
  highestPriced: ResolvedCard[];
  lowestPriced: ResolvedCard[];
  priceRanges: Array<{ range: string; count: number }>;
}

export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeCardStats(
  cards: ResolvedCard[],
  options?: { iconicMap?: Record<number, string>; nowMs?: number }
): ComputedStats {
  const totalCards = cards.length || 77;
  const iconicMap = options?.iconicMap ?? GOLDEN_CHOCOBO_ICONIC_NUMBERS;
  const nowMs = options?.nowMs ?? Date.now();
  const padWidth = Math.max(2, totalCards.toString().length);

  const cardsById = new Map<number, ResolvedCard>();
  for (const c of cards) cardsById.set(c.id, c);

  const iconicWatchlist: IconicWatchItem[] = Object.entries(iconicMap)
    .map(([numStr, label]) => {
      const cardId = parseInt(numStr, 10);
      const card = cardsById.get(cardId);
      return {
        cardId,
        paddedId: cardId.toString().padStart(padWidth, '0'),
        label,
        found: Boolean(card?.found),
        foundBy: card?.foundBy,
        dateFound: card?.dateFound,
        price: card?.price,
        gradingLabel: card?.grading ? `${card.grading.service} ${card.grading.grade}` : undefined,
      };
    })
    .filter((item) => item.cardId >= 1 && item.cardId <= totalCards)
    .sort((a, b) => a.cardId - b.cardId);

  const foundCards = cards.filter((c) => c.found);
  const gradedCards = foundCards.filter((c) => c.grading);

  if (foundCards.length === 0) {
    return {
      totalCards,
      foundCount: 0,
      remainingCount: totalCards,
      foundPercentage: 0,
      pricedCount: 0,
      averagePrice: 0,
      medianPrice: 0,
      highestPrice: 0,
      lowestPrice: 0,
      totalValue: 0,
      rawVsGraded: {
        rawCount: 0,
        rawAverage: 0,
        rawMedian: 0,
        gradedCount: 0,
        gradedAverage: 0,
        gradedMedian: 0,
        gradedPremiumPct: null,
      },
      discoveryVelocity: {
        avgDaysBetweenPulls: null,
        daysSinceLastPull: null,
        firstPullDate: null,
        latestPullDate: null,
      },
      findsByMonth: [],
      priceHistory: [],
      gradingStats: {
        totalGraded: 0,
        averageGrade: 0,
        gradeDistribution: [],
        serviceDistribution: [],
      },
      pullChannelDistribution: [],
      regionDistribution: [],
      iconicWatchlist,
      resaleFlips: [],
      topFinders: [],
      recentDiscoveries: [],
      highestPriced: [],
      lowestPriced: [],
      priceRanges: [],
    };
  }

  const pricedCards = foundCards.filter(
    (c): c is ResolvedCard & { price: number } => typeof c.price === 'number'
  );
  const prices = pricedCards.map((c) => c.price);
  const totalValue = prices.reduce((a, b) => a + b, 0);
  const averagePrice = prices.length > 0 ? totalValue / prices.length : 0;
  const medianPrice = computeMedian(prices);
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Raw vs. Graded pricing comparison
  const rawPrices = pricedCards.filter((c) => !c.grading).map((c) => c.price);
  const gradedPrices = pricedCards.filter((c) => Boolean(c.grading)).map((c) => c.price);
  const rawMedian = computeMedian(rawPrices);
  const gradedMedian = computeMedian(gradedPrices);
  const rawAverage =
    rawPrices.length > 0 ? rawPrices.reduce((a, b) => a + b, 0) / rawPrices.length : 0;
  const gradedAverage =
    gradedPrices.length > 0 ? gradedPrices.reduce((a, b) => a + b, 0) / gradedPrices.length : 0;
  const gradedPremiumPct =
    rawPrices.length > 0 && gradedPrices.length > 0 && rawMedian > 0
      ? ((gradedMedian - rawMedian) / rawMedian) * 100
      : null;

  // Discovery velocity & cumulative curve
  const datedPulls = foundCards
    .filter((c) => c.dateFound && !Number.isNaN(new Date(c.dateFound).getTime()))
    .sort((a, b) => new Date(a.dateFound!).getTime() - new Date(b.dateFound!).getTime());

  let avgDaysBetweenPulls: number | null = null;
  let daysSinceLastPull: number | null = null;
  let firstPullDate: string | null = null;
  let latestPullDate: string | null = null;

  if (datedPulls.length > 0) {
    firstPullDate = datedPulls[0].dateFound!;
    latestPullDate = datedPulls[datedPulls.length - 1].dateFound!;
    const latestMs = new Date(latestPullDate).getTime();
    daysSinceLastPull = Math.max(0, Math.floor((nowMs - latestMs) / 86_400_000));

    if (datedPulls.length > 1) {
      const firstMs = new Date(firstPullDate).getTime();
      const totalDays = Math.max(0, (latestMs - firstMs) / 86_400_000);
      avgDaysBetweenPulls = totalDays / (datedPulls.length - 1);
    }
  }

  const findsByMonthMap = datedPulls.reduce<Record<string, number>>((acc, card) => {
    const month = new Date(card.dateFound!).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  let runningTotal = 0;
  const findsByMonth = Object.entries(findsByMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      runningTotal += count;
      return { month, count, cumulative: runningTotal };
    });

  // Price history timeline
  const priceHistory = foundCards
    .flatMap((card) =>
      (card.priceHistory || []).map((entry) => ({
        date: entry.date,
        price: entry.price,
        cardId: card.id,
        label: `#${card.id.toString().padStart(padWidth, '0')}`,
      }))
    )
    .filter((entry) => !Number.isNaN(new Date(entry.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Multi-sale resale / flip tracker
  const resaleFlips: ResaleFlipItem[] = foundCards
    .filter((c) => (c.priceHistory?.length || 0) >= 2)
    .map((card) => {
      const sorted = [...card.priceHistory]
        .filter((e) => !Number.isNaN(new Date(e.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = sorted[0];
      const latest = sorted[sorted.length - 1];
      const changePct =
        first && first.price > 0 ? ((latest.price - first.price) / first.price) * 100 : 0;
      return {
        cardId: card.id,
        paddedId: card.id.toString().padStart(padWidth, '0'),
        firstPrice: first.price,
        firstDate: first.date,
        latestPrice: latest.price,
        latestDate: latest.date,
        changePct,
        salesCount: sorted.length,
      };
    })
    .filter((f) => f.salesCount >= 2)
    .sort((a, b) => b.latestPrice - a.latestPrice);

  // Pull channel & region distributions
  const channelCounts = foundCards.reduce<Record<string, number>>((acc, card) => {
    if (card.pullChannel) {
      const label = PULL_CHANNEL_LABELS[card.pullChannel];
      acc[label] = (acc[label] || 0) + 1;
    }
    return acc;
  }, {});
  const pullChannelDistribution = Object.entries(channelCounts)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);

  const regionCounts = foundCards.reduce<Record<string, number>>((acc, card) => {
    const cleanRegion = card.region?.trim();
    if (cleanRegion) {
      acc[cleanRegion] = (acc[cleanRegion] || 0) + 1;
    }
    return acc;
  }, {});
  const regionDistribution = Object.entries(regionCounts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

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
    { range: 'Under $25k', count: prices.filter((p) => p < 25000).length },
    { range: '$25k–$50k', count: prices.filter((p) => p >= 25000 && p < 50000).length },
    { range: '$50k–$100k', count: prices.filter((p) => p >= 50000 && p < 100000).length },
    { range: '$100k–$200k', count: prices.filter((p) => p >= 100000 && p < 200000).length },
    { range: '$200k+', count: prices.filter((p) => p >= 200000).length },
  ];

  return {
    totalCards,
    foundCount: foundCards.length,
    remainingCount: Math.max(0, totalCards - foundCards.length),
    foundPercentage: (foundCards.length / totalCards) * 100,
    pricedCount: pricedCards.length,
    averagePrice,
    medianPrice,
    highestPrice,
    lowestPrice,
    totalValue,
    rawVsGraded: {
      rawCount: rawPrices.length,
      rawAverage,
      rawMedian,
      gradedCount: gradedPrices.length,
      gradedAverage,
      gradedMedian,
      gradedPremiumPct,
    },
    discoveryVelocity: {
      avgDaysBetweenPulls,
      daysSinceLastPull,
      firstPullDate,
      latestPullDate,
    },
    findsByMonth,
    priceHistory,
    gradingStats,
    pullChannelDistribution,
    regionDistribution,
    iconicWatchlist,
    resaleFlips,
    topFinders,
    recentDiscoveries,
    highestPriced,
    lowestPriced,
    priceRanges,
  };
}
