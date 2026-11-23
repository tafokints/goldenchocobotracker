import type { Metadata } from 'next';
import Link from 'next/link';
import StatsCharts from '@/components/StatsCharts';
import { getResolvedCards } from '@/lib/redis-cards';
import { getSiteUrl } from '@/lib/site-config';
import { computeCardStats } from '@/lib/stats';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Statistics',
  description:
    'Comprehensive statistics and analytics for the 77 serialized Golden Chocobo cards from MTG Final Fantasy, including grading data, reported sale trends, and discovery patterns.',
  alternates: {
    canonical: '/stats',
  },
};

export default async function StatsPage() {
  const cards = await getResolvedCards();
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
      'Comprehensive statistics and analytics for Golden Chocobo card discoveries, including grading data, price trends, and discovery patterns',
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
          <Link href="/" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
            &larr; Back to Tracker
          </Link>
        </header>

        {stats.foundCount === 0 ? (
          <div className="text-center text-chocobo-light">
            No cards found yet. Check back later for stats!
          </div>
        ) : (
          <div className="w-full max-w-7xl space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-lg font-bold text-chocobo-light">Cards Found</h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  {stats.foundCount}/{stats.totalCards}
                </p>
                <p className="text-sm text-chocobo-light/80 mt-1">
                  {stats.foundPercentage.toFixed(1)}% Complete
                </p>
              </div>
              <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-lg font-bold text-chocobo-light">Reported Total Value</h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  ${Math.round(stats.totalValue).toLocaleString()}
                </p>
                <p className="text-sm text-chocobo-light/80 mt-1">Across Priced Cards</p>
              </div>
              <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-lg font-bold text-chocobo-light">Average Sale Price</h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  ${Math.round(stats.averagePrice).toLocaleString()}
                </p>
                <p className="text-sm text-chocobo-light/80 mt-1">Per Priced Card</p>
              </div>
              <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h2 className="text-lg font-bold text-chocobo-light">Graded Cards</h2>
                <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
                  {stats.gradingStats.totalGraded}
                </p>
                <p className="text-sm text-chocobo-light/80 mt-1">
                  Avg Grade: {stats.gradingStats.averageGrade.toFixed(1)}
                </p>
              </div>
            </div>

            <StatsCharts
              priceRanges={stats.priceRanges}
              findsByMonth={stats.findsByMonth}
              priceHistory={stats.priceHistory}
              gradingStats={stats.gradingStats}
            />

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
      </main>
    </>
  );
}
