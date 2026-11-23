import type { Metadata } from 'next';
import Link from 'next/link';
import AffiliateLinks from '@/components/AffiliateLinks';
import StatsCharts from '@/components/StatsCharts';
import { formatCompactUsd } from '@/lib/format';
import { getSiteUrl } from '@/lib/site-config';
import { computeCardStats } from '@/lib/stats';
import { getCards } from '@/lib/tracker-store';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Statistics & Market Analytics',
  description:
    'Live MTGFinance statistics and collector analytics for the 77 serialized Golden Chocobo cards: median vs. average sales, raw vs. graded premiums, cumulative pull velocity, and iconic grail watchlist.',
  alternates: {
    canonical: '/stats',
  },
  openGraph: {
    title: 'Golden Chocobo Statistics & Market Analytics',
    description:
      'Live median vs. average sale prices, raw vs. graded premiums, cumulative discovery curve, and iconic grail watchlist for all 77 serialized Golden Chocobo cards.',
    images: [{ url: '/api/og?view=stats', width: 1200, height: 630, alt: 'Golden Chocobo Statistics' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og?view=stats'],
  },
};

export default async function StatsPage() {
  const cards = await getCards();
  const stats = computeCardStats(cards);

  const firstMonth = stats.findsByMonth[0]?.month ?? '2025-06';
  const latestMonth =
    stats.findsByMonth[stats.findsByMonth.length - 1]?.month ??
    new Date().toISOString().slice(0, 7);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Golden Chocobo Statistics',
    description:
      'Comprehensive statistics and market analytics for Golden Chocobo card discoveries, including median sales, raw vs. graded premiums, and discovery velocity',
    url: `${getSiteUrl()}/stats`,
    mainEntity: {
      '@type': 'Dataset',
      name: 'Golden Chocobo Card Statistics',
      description: 'Detailed statistics for 77 serialized Golden Chocobo cards from MTG Final Fantasy',
      numberOfItems: stats.foundCount,
      temporalCoverage: `${firstMonth}/${latestMonth}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-chocobo-gold/20 pb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold">
              Market &amp; Pull Statistics
            </h1>
            <p className="text-xs sm:text-sm text-chocobo-muted mt-1">
              Verified pull velocity, reported sale medians, raw vs. graded premiums, and iconic serials.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href="/api/export?format=csv"
              className="border border-chocobo-gold/60 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-semibold py-1.5 px-3 rounded transition-colors"
            >
              Download CSV
            </a>
            <a
              href="/feed.xml"
              className="border border-chocobo-light/15 hover:border-chocobo-gold/50 text-chocobo-muted hover:text-chocobo-light py-1.5 px-3 rounded transition-colors"
            >
              RSS Feed
            </a>
          </div>
        </div>

        {stats.foundCount === 0 ? (
          <div className="text-center text-chocobo-muted py-12">
            No cards found yet. Check back later for stats!
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Overview KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-chocobo-surface p-4 rounded-lg border border-chocobo-gold/30">
                <p className="text-xs font-medium text-chocobo-muted">Cards Found</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold mt-1.5 tabular-nums">
                  {stats.foundCount}/{stats.totalCards}
                </p>
                <p className="text-xs text-chocobo-muted mt-1 tabular-nums">
                  {stats.foundPercentage.toFixed(1)}% &middot; {stats.remainingCount} unpulled
                </p>
              </div>

              <div className="bg-chocobo-surface p-4 rounded-lg border border-chocobo-gold/30">
                <p className="text-xs font-medium text-chocobo-muted">Median Sale</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 mt-1.5 tabular-nums">
                  ${Math.round(stats.medianPrice).toLocaleString()}
                </p>
                <p className="text-xs text-chocobo-muted mt-1">
                  Across {stats.pricedCount} priced cards
                </p>
              </div>

              <div className="bg-chocobo-surface p-4 rounded-lg border border-chocobo-gold/30">
                <p className="text-xs font-medium text-chocobo-muted">Average Sale</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold mt-1.5 tabular-nums">
                  ${Math.round(stats.averagePrice).toLocaleString()}
                </p>
                <p className="text-xs text-chocobo-muted mt-1 tabular-nums">
                  {formatCompactUsd(stats.lowestPrice)} &ndash; {formatCompactUsd(stats.highestPrice)}
                </p>
              </div>

              <div className="bg-chocobo-surface p-4 rounded-lg border border-chocobo-gold/30">
                <p className="text-xs font-medium text-chocobo-muted">Graded Pop</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-sky-400 mt-1.5 tabular-nums">
                  {stats.gradingStats.totalGraded}
                </p>
                <p className="text-xs text-chocobo-muted mt-1 tabular-nums">
                  Avg Grade: {stats.gradingStats.averageGrade.toFixed(1)}
                </p>
              </div>

              <div className="bg-chocobo-surface p-4 rounded-lg border border-chocobo-gold/30">
                <p className="text-xs font-medium text-chocobo-muted">Pull Pace</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold mt-1.5 tabular-nums">
                  {stats.discoveryVelocity.avgDaysBetweenPulls !== null
                    ? `${stats.discoveryVelocity.avgDaysBetweenPulls.toFixed(1)}d`
                    : '—'}
                </p>
                <p className="text-xs text-chocobo-muted mt-1 tabular-nums">
                  {stats.discoveryVelocity.daysSinceLastPull !== null
                    ? `${stats.discoveryVelocity.daysSinceLastPull}d since last pull`
                    : 'Avg days between pulls'}
                </p>
              </div>
            </div>

            {/* Raw vs. Graded Market Comparison */}
            {(stats.rawVsGraded.rawCount > 0 || stats.rawVsGraded.gradedCount > 0) && (
              <section
                aria-label="Raw versus graded sale prices"
                className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25"
              >
                <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold">
                    Raw vs. Graded Market Comparison
                  </h2>
                  {stats.rawVsGraded.gradedPremiumPct !== null && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded border tabular-nums ${
                        stats.rawVsGraded.gradedPremiumPct >= 0
                          ? 'bg-emerald-950/70 border-emerald-500/35 text-emerald-300'
                          : 'bg-red-950/70 border-red-500/35 text-red-300'
                      }`}
                    >
                      Graded Median Premium:{' '}
                      {stats.rawVsGraded.gradedPremiumPct >= 0 ? '+' : ''}
                      {stats.rawVsGraded.gradedPremiumPct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-chocobo-recessed border border-chocobo-gold/20 rounded-md p-4">
                    <p className="text-xs font-medium text-chocobo-muted">
                      Ungraded (Raw) &middot; {stats.rawVsGraded.rawCount} priced sales
                    </p>
                    <p className="font-display text-2xl font-bold text-chocobo-gold mt-1 tabular-nums">
                      Median: ${Math.round(stats.rawVsGraded.rawMedian).toLocaleString()}
                    </p>
                    <p className="text-xs text-chocobo-muted mt-0.5 tabular-nums">
                      Average: ${Math.round(stats.rawVsGraded.rawAverage).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-chocobo-recessed border border-sky-400/25 rounded-md p-4">
                    <p className="text-xs font-medium text-sky-300">
                      Graded (PSA / BGS / CGC) &middot; {stats.rawVsGraded.gradedCount} priced sales
                    </p>
                    <p className="font-display text-2xl font-bold text-sky-400 mt-1 tabular-nums">
                      Median: ${Math.round(stats.rawVsGraded.gradedMedian).toLocaleString()}
                    </p>
                    <p className="text-xs text-chocobo-muted mt-0.5 tabular-nums">
                      Average: ${Math.round(stats.rawVsGraded.gradedAverage).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Iconic / Grail Serial Numbers Watchlist */}
            <section
              aria-label="Iconic serial numbers watchlist"
              className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25"
            >
              <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
                <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold">
                  ★ Iconic &amp; Grail Numbers Watchlist
                </h2>
                <span className="text-xs text-chocobo-muted">
                  {stats.iconicWatchlist.filter((i) => !i.found).length} of{' '}
                  {stats.iconicWatchlist.length} iconic numbers still unpulled
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.iconicWatchlist.map((item) => (
                  <Link
                    key={item.cardId}
                    href={`/card/${item.paddedId}`}
                    className={`rounded-md border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      item.found
                        ? 'bg-chocobo-gold/10 border-chocobo-gold/45 hover:border-chocobo-gold'
                        : 'bg-chocobo-recessed border-chocobo-light/10 hover:border-chocobo-gold/45'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-chocobo-gold tabular-nums">
                        <span className="font-display">#{item.paddedId}</span> &middot; {item.label}
                      </p>
                      <p className="text-xs text-chocobo-muted truncate mt-0.5">
                        {item.found
                          ? `Found by ${item.foundBy || 'Unknown'}${item.gradingLabel ? ` · ${item.gradingLabel}` : ''}`
                          : 'Still unpulled'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          item.found
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950/70 text-amber-200 border border-chocobo-gold/30'
                        }`}
                      >
                        {item.found ? 'Found' : 'Unpulled'}
                      </span>
                      {typeof item.price === 'number' && (
                        <p className="text-xs font-semibold text-emerald-400 tabular-nums mt-1">
                          {formatCompactUsd(item.price)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Charts */}
            <StatsCharts
              priceRanges={stats.priceRanges}
              findsByMonth={stats.findsByMonth}
              priceHistory={stats.priceHistory}
              gradingStats={stats.gradingStats}
              pullChannelDistribution={stats.pullChannelDistribution}
              regionDistribution={stats.regionDistribution}
            />

            {/* Multi-Sale Flip / Resale History */}
            {stats.resaleFlips.length > 0 && (
              <section
                aria-label="Multi-sale resale history"
                className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25"
              >
                <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold mb-4">
                  Multi-Sale Resale &amp; Flip Tracker
                </h2>
                <div className="space-y-2">
                  {stats.resaleFlips.map((flip) => (
                    <Link
                      key={flip.cardId}
                      href={`/card/${flip.paddedId}`}
                      className="flex flex-wrap justify-between items-center gap-2 bg-chocobo-recessed hover:bg-chocobo-gold/10 border border-chocobo-gold/20 rounded-md px-4 py-2.5 text-sm transition-colors"
                    >
                      <span className="font-semibold text-chocobo-gold tabular-nums">
                        <span className="font-display">#{flip.paddedId}</span>{' '}
                        <span className="text-xs font-normal text-chocobo-muted">
                          ({flip.salesCount} sales)
                        </span>
                      </span>
                      <span className="text-xs sm:text-sm text-chocobo-light tabular-nums">
                        ${flip.firstPrice.toLocaleString()} ({flip.firstDate}) &rarr;{' '}
                        <strong className="text-emerald-400">
                          ${flip.latestPrice.toLocaleString()}
                        </strong>{' '}
                        ({flip.latestDate})
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${
                          flip.changePct >= 0
                            ? 'bg-emerald-950/80 text-emerald-300'
                            : 'bg-red-950/80 text-red-300'
                        }`}
                      >
                        {flip.changePct >= 0 ? '+' : ''}
                        {flip.changePct.toFixed(1)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Top Finders and Recent Discoveries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25">
                <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold mb-4">
                  Top Discoverers
                </h2>
                <div className="divide-y divide-chocobo-gold/10 text-sm">
                  {stats.topFinders.map((finder, index) => (
                    <div key={finder.finder} className="flex justify-between items-center py-2">
                      <span className="text-chocobo-light">
                        <span className="text-chocobo-muted tabular-nums mr-2">{index + 1}.</span>
                        {finder.finder}
                      </span>
                      <span className="text-chocobo-gold font-semibold tabular-nums text-xs">
                        {finder.count} {finder.count === 1 ? 'card' : 'cards'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25">
                <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold mb-4">
                  Recent Discoveries
                </h2>
                <div className="divide-y divide-chocobo-gold/10 text-sm">
                  {stats.recentDiscoveries.map((card) => {
                    const paddedId = card.id.toString().padStart(2, '0');
                    return (
                      <div key={card.id} className="flex justify-between items-center gap-3 py-2">
                        <Link
                          href={`/card/${paddedId}`}
                          className="text-chocobo-light hover:text-chocobo-gold transition-colors truncate"
                        >
                          <span className="font-display font-bold text-chocobo-gold mr-1.5">
                            #{paddedId}
                          </span>
                          {card.foundBy || 'Unknown'}
                        </Link>
                        <div className="flex items-center gap-2 shrink-0 text-xs tabular-nums">
                          {typeof card.price === 'number' && (
                            <span className="text-emerald-400 font-semibold">
                              {formatCompactUsd(card.price)}
                            </span>
                          )}
                          <span className="text-chocobo-muted">{card.dateFound || '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Extremes */}
            {(stats.highestPriced.length > 0 || stats.lowestPriced.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold mb-4">
                    Highest Reported Sales
                  </h2>
                  <div className="divide-y divide-chocobo-gold/10 text-sm">
                    {stats.highestPriced.map((card) => {
                      const paddedId = card.id.toString().padStart(2, '0');
                      return (
                        <div key={card.id} className="flex justify-between items-center gap-2 py-2">
                          <Link
                            href={`/card/${paddedId}`}
                            className="text-chocobo-light hover:text-chocobo-gold transition-colors truncate"
                          >
                            <span className="font-display font-bold text-chocobo-gold mr-1.5">
                              #{paddedId}
                            </span>
                            {card.foundBy || 'Unknown'}
                          </Link>
                          <span className="text-emerald-400 font-semibold tabular-nums shrink-0">
                            ${card.price?.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold mb-4">
                    Lowest Reported Sales
                  </h2>
                  <div className="divide-y divide-chocobo-gold/10 text-sm">
                    {stats.lowestPriced.map((card) => {
                      const paddedId = card.id.toString().padStart(2, '0');
                      return (
                        <div key={card.id} className="flex justify-between items-center gap-2 py-2">
                          <Link
                            href={`/card/${paddedId}`}
                            className="text-chocobo-light hover:text-chocobo-gold transition-colors truncate"
                          >
                            <span className="font-display font-bold text-chocobo-gold mr-1.5">
                              #{paddedId}
                            </span>
                            {card.foundBy || 'Unknown'}
                          </Link>
                          <span className="text-chocobo-gold font-semibold tabular-nums shrink-0">
                            ${card.price?.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <AffiliateLinks />
      </main>
    </>
  );
}
