import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatsCharts from '@/components/StatsCharts';
import { getHydratedTracker } from '@/lib/multi-tracker';
import { computeCardStats } from '@/lib/stats';

export const revalidate = 300;

interface TrackerStatsPageProps {
  params: Promise<{ trackerSlug: string }>;
}

export async function generateMetadata({ params }: TrackerStatsPageProps): Promise<Metadata> {
  const { trackerSlug } = await params;
  const tracker = await getHydratedTracker(trackerSlug);
  if (!tracker) return { title: 'Stats Not Found' };

  return {
    title: `${tracker.name} Statistics`,
    description: `Live pull progress, reported sales, and grading analytics for ${tracker.name}.`,
    alternates: { canonical: `/t/${tracker.slug}/stats` },
  };
}

export default async function DynamicTrackerStatsPage({ params }: TrackerStatsPageProps) {
  const { trackerSlug } = await params;
  const tracker = await getHydratedTracker(trackerSlug);
  if (!tracker || !tracker.isPublished) {
    notFound();
  }

  const allCards = tracker.series.flatMap((s) => s.cards);
  const stats = computeCardStats(allCards);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-4 mb-8 font-mono text-sm">
        <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold">
          {tracker.name} — Statistics
        </h1>
        <Link
          href={`/t/${tracker.slug}`}
          className="text-chocobo-gold hover:text-yellow-400 transition-colors"
        >
          &larr; Back to {tracker.name}
        </Link>
      </header>

      <div className="w-full max-w-7xl space-y-8">
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
          </div>
          <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold text-center">
            <h2 className="text-lg font-bold text-chocobo-light">Average Sale Price</h2>
            <p className="text-3xl font-bold text-chocobo-gold mt-2 tabular-nums">
              ${Math.round(stats.averagePrice).toLocaleString()}
            </p>
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

        {tracker.series.length > 1 && (
          <section className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
            <h2 className="text-xl font-bold text-chocobo-gold mb-4">Progress by Series</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracker.series.map((s) => (
                <div key={s.id} className="bg-black/30 border border-chocobo-gold/30 rounded p-4">
                  <p className="font-bold text-chocobo-gold">{s.name}</p>
                  <p className="text-sm text-chocobo-light tabular-nums mt-1">
                    {s.foundCount} / {s.totalCount} found (
                    {s.totalCount > 0 ? ((s.foundCount / s.totalCount) * 100).toFixed(1) : '0.0'}%)
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats.foundCount > 0 ? (
          <StatsCharts
            priceRanges={stats.priceRanges}
            findsByMonth={stats.findsByMonth}
            priceHistory={stats.priceHistory}
            gradingStats={stats.gradingStats}
          />
        ) : (
          <div className="text-center py-8 text-chocobo-light/80">
            No discoveries logged yet for this tracker.
          </div>
        )}
      </div>
    </main>
  );
}
