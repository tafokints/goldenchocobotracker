import { formatGradingDisplay } from '@/lib/grading';
import { GOLDEN_CHOCOBO_ICONIC_NUMBERS } from '@/lib/iconic-numbers';
import { PULL_CHANNEL_LABELS, type PriceHistoryEntry, type ResolvedCard } from './types';

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

export interface PopReportTier {
  key: string;
  label: string;
  grade: number;
  gradeLabel?: string;
  cards: Array<{ id: number; paddedId: string }>;
}

export interface PopReportServiceGroup {
  service: string;
  totalCount: number;
  tiers: PopReportTier[];
}

const CANONICAL_SERVICES = ['PSA', 'BGS', 'CGC', 'TAG'] as const;

type GradingWithOptionalLabel = NonNullable<ResolvedCard['grading']> & {
  gradeLabel?: string;
};

function normalizeServiceName(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper === 'BECKETT') return 'BGS';
  return upper || 'OTHER';
}

function getTierPrestigeRank(gradeLabel?: string): number {
  if (!gradeLabel) return 0;
  const lower = gradeLabel.toLowerCase();
  if (lower.includes('black label')) return 4;
  if (lower.includes('pristine')) return 3;
  if (lower.includes('mba') || lower.includes('gold')) return 2;
  return 1;
}

function formatPopTierLabel(grade: number, gradeLabel?: string): string {
  const cleanLabel = gradeLabel?.trim();
  if (!cleanLabel) return `Grade ${grade}`;
  return cleanLabel.includes(String(grade)) ? cleanLabel : `${grade} · ${cleanLabel}`;
}

export function buildPopulationReport(
  cards: ResolvedCard[],
  padWidth?: number
): {
  totalGraded: number;
  groups: PopReportServiceGroup[];
} {
  const effectivePadWidth = padWidth ?? Math.max(2, (cards.length || 77).toString().length);
  const gradedCards = cards.filter(
    (card): card is ResolvedCard & { grading: GradingWithOptionalLabel } =>
      card.found && Boolean(card.grading)
  );

  const serviceMap = new Map<string, Map<string, PopReportTier>>();

  for (const card of gradedCards) {
    const grading = card.grading as GradingWithOptionalLabel;
    const service = normalizeServiceName(grading.service);
    const cleanLabel = grading.gradeLabel?.trim() || undefined;
    const tierKey = `${grading.grade}::${cleanLabel?.toLowerCase() ?? ''}`;

    let tierMap = serviceMap.get(service);
    if (!tierMap) {
      tierMap = new Map<string, PopReportTier>();
      serviceMap.set(service, tierMap);
    }

    let tier = tierMap.get(tierKey);
    if (!tier) {
      tier = {
        key: tierKey,
        label: formatPopTierLabel(grading.grade, cleanLabel),
        grade: grading.grade,
        gradeLabel: cleanLabel,
        cards: [],
      };
      tierMap.set(tierKey, tier);
    }

    tier.cards.push({
      id: card.id,
      paddedId: card.id.toString().padStart(effectivePadWidth, '0'),
    });
  }

  const orderedServices = [
    ...CANONICAL_SERVICES.filter((svc) => serviceMap.has(svc)),
    ...Array.from(serviceMap.keys())
      .filter((svc) => !CANONICAL_SERVICES.includes(svc as (typeof CANONICAL_SERVICES)[number]))
      .sort((a, b) => a.localeCompare(b)),
  ];

  const groups: PopReportServiceGroup[] = orderedServices.map((service) => {
    const tiers = Array.from(serviceMap.get(service)!.values())
      .map((tier) => ({
        ...tier,
        cards: [...tier.cards].sort((a, b) => a.id - b.id),
      }))
      .sort((a, b) => {
        if (b.grade !== a.grade) return b.grade - a.grade;
        const prestigeDiff =
          getTierPrestigeRank(b.gradeLabel) - getTierPrestigeRank(a.gradeLabel);
        if (prestigeDiff !== 0) return prestigeDiff;
        return a.label.localeCompare(b.label);
      });

    const totalCount = tiers.reduce((sum, t) => sum + t.cards.length, 0);
    return { service, totalCount, tiers };
  });

  return {
    totalGraded: gradedCards.length,
    groups,
  };
}

export function buildAdaptivePriceRanges(prices: number[]): Array<{ range: string; count: number }> {
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  if (maxPrice >= 50000 || prices.length === 0) {
    return [
      { range: 'Under $25k', count: prices.filter((p) => p < 25000).length },
      { range: '$25k–$50k', count: prices.filter((p) => p >= 25000 && p < 50000).length },
      { range: '$50k–$100k', count: prices.filter((p) => p >= 50000 && p < 100000).length },
      { range: '$100k–$200k', count: prices.filter((p) => p >= 100000 && p < 200000).length },
      { range: '$200k+', count: prices.filter((p) => p >= 200000).length },
    ];
  }

  if (maxPrice >= 5000) {
    return [
      { range: 'Under $5k', count: prices.filter((p) => p < 5000).length },
      { range: '$5k–$10k', count: prices.filter((p) => p >= 5000 && p < 10000).length },
      { range: '$10k–$15k', count: prices.filter((p) => p >= 10000 && p < 15000).length },
      { range: '$15k–$20k', count: prices.filter((p) => p >= 15000 && p < 20000).length },
      { range: '$20k+', count: prices.filter((p) => p >= 20000).length },
    ];
  }

  return [
    { range: 'Under $500', count: prices.filter((p) => p < 500).length },
    { range: '$500–$1k', count: prices.filter((p) => p >= 500 && p < 1000).length },
    { range: '$1k–$2.5k', count: prices.filter((p) => p >= 1000 && p < 2500).length },
    { range: '$2.5k–$5k', count: prices.filter((p) => p >= 2500 && p < 5000).length },
    { range: '$5k+', count: prices.filter((p) => p >= 5000).length },
  ];
}

export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function dedupeCardPriceHistory(
  entries: PriceHistoryEntry[] | undefined
): PriceHistoryEntry[] {
  if (!entries || entries.length === 0) return [];
  const seen = new Set<string>();
  const deduped: PriceHistoryEntry[] = [];

  for (const entry of entries) {
    const normalizedDate = entry.date.trim();
    const key = `${Math.round(entry.price * 100)}|${normalizedDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...entry, date: normalizedDate });
  }

  return deduped;
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
        gradingLabel: card?.grading ? formatGradingDisplay(card.grading) : undefined,
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

  // Price history timeline (deduplicated per card by price + date)
  const priceHistory = foundCards
    .flatMap((card) =>
      dedupeCardPriceHistory(card.priceHistory).map((entry) => ({
        date: entry.date,
        price: entry.price,
        cardId: card.id,
        label: `#${card.id.toString().padStart(padWidth, '0')}`,
      }))
    )
    .filter((entry) => !Number.isNaN(new Date(entry.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Multi-sale resale / flip tracker (deduplicated per card so duplicate entries never create fake 0% flips)
  const resaleFlips: ResaleFlipItem[] = foundCards
    .map((card) => {
      const sorted = dedupeCardPriceHistory(card.priceHistory)
        .filter((e) => !Number.isNaN(new Date(e.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sorted.length < 2) return null;
      const first = sorted[0];
      const latest = sorted[sorted.length - 1];
      const changePct =
        first.price > 0 ? ((latest.price - first.price) / first.price) * 100 : 0;
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
    .filter((f): f is ResaleFlipItem => f !== null)
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

  const priceRanges = buildAdaptivePriceRanges(prices);

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
