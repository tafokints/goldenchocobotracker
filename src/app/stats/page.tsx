import type { Metadata } from 'next';
import Link from 'next/link';
import AffiliateLinks from '@/components/AffiliateLinks';
import StatsCharts from '@/components/StatsCharts';
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
      <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
        <header className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm flex flex-wrap gap-4 mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold">
            Golden Chocobo Statistics
          </h1>
          <div className="flex items-center flex-wrap gap-4">
            <a
              href="/api/export?format=csv"
              className="border border-chocobo-gold/80 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-bold py-1.5 px-3 rounded text-xs transition-colors"
            >
              Download CSV
            </a>
            <Link
              href="/feed.xml"
              className="text-chocobo-light/80 hover:text-chocobo-gold text-xs"
            >
              RSS Feed
            </Link>
            <Link href="/" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
              &larr; Back to Tracker
            </Link>
          </div>
        </header>

        {stats.foundCount === 0 ? (
          <div className="text-center text-chocobo-light">
            No cards found yet. Check back later for stats!
          </div>
        ) : (
          <div className="w-full max-w-7xl space-y-8">
            {/* Primary Overview KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-chocobo-dark/75 p-5 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-light/80">
                  Cards Found
                </h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  {stats.foundCount}/{stats.totalCards}
                </p>
                <p className="text-xs text-chocobo-light/80 mt-1">
                  {stats.foundPercentage.toFixed(1)}% · {stats.remainingCount} unpulled
                </p>
              </div>

              <div className="bg-chocobo-dark/75 p-5 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-light/80">
                  Median Sale
                </h2>
                <p className="text-3xl font-bold text-green-400 mt-2 tabular-nums">
                  ${Math.round(stats.medianPrice).toLocaleString()}
                </p>
                <p className="text-xs text-chocobo-light/80 mt-1">
                  Across {stats.pricedCount} priced cards
                </p>
              </div>

              <div className="bg-chocobo-dark/75 p-5 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-light/80">
                  Average Sale
                </h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  ${Math.round(stats.averagePrice).toLocaleString()}
                </p>
                <p className="text-xs text-chocobo-light/80 mt-1">
                  Range: ${stats.lowestPrice.toLocaleString()}–${stats.highestPrice.toLocaleString()}
                </p>
              </div>

              <div className="bg-chocobo-dark/75 p-5 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-light/80">
                  Graded Pop
                </h2>
                <p className="text-3xl font-bold text-blue-400 mt-2 tabular-nums">
                  {stats.gradingStats.totalGraded}
                </p>
                <p className="text-xs text-chocobo-light/80 mt-1">
                  Avg Grade: {stats.gradingStats.averageGrade.toFixed(1)}
                </p>
              </div>

              <div className="bg-chocobo-dark/75 p-5 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-light/80">
                  Pull Pace
                </h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  {stats.discoveryVelocity.avgDaysBetweenPulls !== null
                    ? `${stats.discoveryVelocity.avgDaysBetweenPulls.toFixed(1)}d`
                    : '—'}
                </p>
                <p className="text-xs text-chocobo-light/80 mt-1">
                  {stats.discoveryVelocity.daysSinceLastPull !== null
                    ? `Avg gap · ${stats.discoveryVelocity.daysSinceLastPull}d since last pull`
                    : 'Avg days between pulls'}
                </p>
              </div>
            </div>

            {/* Raw vs. Graded Market Comparison */}
            {(stats.rawVsGraded.rawCount > 0 || stats.rawVsGraded.gradedCount > 0) && (
              <section
                aria-label="Raw versus graded sale prices"
                className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold"
              >
                <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
                  <h2 className="text-xl font-bold text-chocobo-gold">
                    Raw vs. Graded Market Comparison
                  </h2>
                  {stats.rawVsGraded.gradedPremiumPct !== null && (
                    <span
                      className={`text-sm font-bold px-2.5 py-0.5 rounded ${
                        stats.rawVsGraded.gradedPremiumPct >= 0
                          ? 'bg-green-900/60 text-green-300'
                          : 'bg-red-900/60 text-red-300'
                      }`}
                    >
                      Graded Median Premium:{' '}
                      {stats.rawVsGraded.gradedPremiumPct >= 0 ? '+' : ''}
                      {stats.rawVsGraded.gradedPremiumPct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/30 border border-chocobo-gold/30 rounded p-4">
                    <p className="text-xs uppercase tracking-wider text-chocobo-light/70 font-bold">
                      Ungraded (Raw) — {stats.rawVsGraded.rawCount} priced sales
                    </p>
                    <p className="text-2xl font-bold text-chocobo-gold mt-1 tabular-nums">
                      Median: ${Math.round(stats.rawVsGraded.rawMedian).toLocaleString()}
                    </p>
                    <p className="text-xs text-chocobo-light/75 mt-0.5 tabular-nums">
                      Average: ${Math.round(stats.rawVsGraded.rawAverage).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-black/30 border border-blue-400/40 rounded p-4">
                    <p className="text-xs uppercase tracking-wider text-blue-300 font-bold">
                      Graded (PSA / BGS / CGC) — {stats.rawVsGraded.gradedCount} priced sales
                    </p>
                    <p className="text-2xl font-bold text-blue-400 mt-1 tabular-nums">
                      Median: ${Math.round(stats.rawVsGraded.gradedMedian).toLocaleString()}
                    </p>
                    <p className="text-xs text-chocobo-light/75 mt-0.5 tabular-nums">
                      Average: ${Math.round(stats.rawVsGraded.gradedAverage).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Iconic / Grail Serial Numbers Watchlist */}
            <section
              aria-label="Iconic serial numbers watchlist"
              className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold"
            >
              <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
                <h2 className="text-xl font-bold text-chocobo-gold">
                  ★ Iconic &amp; Grail Numbers Watchlist
                </h2>
                <span className="text-xs text-chocobo-light/75">
                  {stats.iconicWatchlist.filter((i) => !i.found).length} of{' '}
                  {stats.iconicWatchlist.length} iconic numbers still unpulled
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.iconicWatchlist.map((item) => (
                  <Link
                    key={item.cardId}
                    href={`/card/${item.paddedId}`}
                    className={`rounded border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      item.found
                        ? 'bg-chocobo-gold/10 border-chocobo-gold/60 hover:bg-chocobo-gold/20'
                        : 'bg-black/30 border-yellow-400/35 hover:border-chocobo-gold'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-chocobo-gold tabular-nums">
                        #{item.paddedId} · {item.label}
                      </p>
                      <p className="text-xs text-chocobo-light/75 truncate mt-0.5">
                        {item.found
                          ? `Found by ${item.foundBy || 'Unknown'}${item.gradingLabel ? ` · ${item.gradingLabel}` : ''}`
                          : 'Still unpulled in the wild'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.found
                            ? 'bg-green-800/60 text-green-300'
                            : 'bg-yellow-900/60 text-yellow-200'
                        }`}
                      >
                        {item.found ? 'Found' : 'Unpulled'}
                      </span>
                      {typeof item.price === 'number' && (
                        <p className="text-xs font-bold text-green-400 tabular-nums mt-1">
                          ${item.price.toLocaleString()}
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
                className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold"
              >
                <h2 className="text-xl font-bold text-chocobo-gold mb-4">
                  Multi-Sale Resale &amp; Flip Tracker
                </h2>
                <div className="space-y-2">
                  {stats.resaleFlips.map((flip) => (
                    <Link
                      key={flip.cardId}
                      href={`/card/${flip.paddedId}`}
                      className="flex flex-wrap justify-between items-center gap-2 bg-black/30 hover:bg-chocobo-gold/10 border border-chocobo-gold/25 rounded px-4 py-2.5 text-sm transition-colors"
                    >
                      <span className="font-bold text-chocobo-gold tabular-nums">
                        #{flip.paddedId} ({flip.salesCount} recorded sales)
                      </span>
                      <span className="text-chocobo-light tabular-nums">
                        ${flip.firstPrice.toLocaleString()} ({flip.firstDate}) &rarr;{' '}
                        <strong className="text-green-400">
                          ${flip.latestPrice.toLocaleString()}
                        </strong>{' '}
                        ({flip.latestDate})
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded tabular-nums ${
                          flip.changePct >= 0
                            ? 'bg-green-900/60 text-green-300'
                            : 'bg-red-900/60 text-red-300'
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
              <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
                <h2 className="text-xl font-bold text-chocobo-gold mb-4">Top Discoverers</h2>
                <div className="space-y-2">
                  {stats.topFinders.map((finder, index) => (
                    <div key={finder.finder} className="flex justify-between items-center">
                      <span className="text-chocobo-light">
                        {index + 1}. {finder.finder}
                      </span>
                      <span className="text-chocobo-gold font-bold tabular-nums">
                        {finder.count} {finder.count === 1 ? 'card' : 'cards'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
                <h2 className="text-xl font-bold text-chocobo-gold mb-4">Recent Discoveries</h2>
                <div className="space-y-2">
                  {stats.recentDiscoveries.map((card) => {
                    const paddedId = card.id.toString().padStart(2, '0');
                    return (
                      <div key={card.id} className="flex justify-between items-center gap-2">
                        <Link
                          href={`/card/${paddedId}`}
                          className="text-chocobo-light hover:text-chocobo-gold transition-colors truncate"
                        >
                          #{paddedId} - {card.foundBy || 'Unknown'}
                        </Link>
                        <span className="text-chocobo-gold font-bold tabular-nums shrink-0">
                          {typeof card.price === 'number'
                            ? `$${card.price.toLocaleString()}`
                            : card.dateFound || 'N/A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Extremes */}
            {(stats.highestPriced.length > 0 || stats.lowestPriced.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
                  <h2 className="text-xl font-bold text-chocobo-gold mb-4">Highest Priced Cards</h2>
                  <div className="space-y-2">
                    {stats.highestPriced.map((card) => {
                      const paddedId = card.id.toString().padStart(2, '0');
                      return (
                        <div key={card.id} className="flex justify-between items-center gap-2">
                          <Link
                            href={`/card/${paddedId}`}
                            className="text-chocobo-light hover:text-chocobo-gold transition-colors truncate"
                          >
                            #{paddedId} - {card.foundBy || 'Unknown'}
                          </Link>
                          <span className="text-chocobo-gold font-bold tabular-nums shrink-0">
                            ${card.price?.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
                  <h2 className="text-xl font-bold text-chocobo-gold mb-4">Lowest Priced Cards</h2>
                  <div className="space-y-2">
                    {stats.lowestPriced.map((card) => {
                      const paddedId = card.id.toString().padStart(2, '0');
                      return (
                        <div key={card.id} className="flex justify-between items-center gap-2">
                          <Link
                            href={`/card/${paddedId}`}
                            className="text-chocobo-light hover:text-chocobo-gold transition-colors truncate"
                          >
                            #{paddedId} - {card.foundBy || 'Unknown'}
                          </Link>
                          <span className="text-chocobo-gold font-bold tabular-nums shrink-0">
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
