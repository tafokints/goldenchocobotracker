import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatsCharts from '@/components/StatsCharts';
import { formatCompactUsd } from '@/lib/format';
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
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-chocobo-gold/20 pb-4">
        <div>
          <h1
            className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold"
            style={{ color: tracker.themeConfig.accentHex }}
          >
            {tracker.name} &mdash; Statistics
          </h1>
          <p className="text-xs sm:text-sm text-chocobo-muted mt-1">
            {tracker.setName} &middot; Live pull velocity, reported sale medians, and grading breakdown.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs w-full sm:w-auto">
          <Link
            href={`/t/${tracker.slug}`}
            className="inline-flex items-center justify-center min-h-[38px] sm:min-h-0 border border-chocobo-light/15 hover:border-chocobo-gold/50 text-chocobo-muted hover:text-chocobo-light py-2 sm:py-1.5 px-3 rounded transition-colors truncate"
          >
            &larr; {tracker.name}
          </Link>
          <Link
            href={`/t/${tracker.slug}/submit`}
            className="inline-flex items-center justify-center min-h-[38px] sm:min-h-0 border border-chocobo-gold/60 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-semibold py-2 sm:py-1.5 px-3 rounded transition-colors"
          >
            Submit Update
          </Link>
        </div>
      </div>

      {/* Primary Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="bg-chocobo-surface p-3.5 sm:p-4 rounded-lg border border-chocobo-gold/30">
          <p className="text-[11px] sm:text-xs font-medium text-chocobo-muted">Cards Found</p>
          <p className="font-display text-xl sm:text-3xl font-bold text-chocobo-gold mt-1 sm:mt-1.5 tabular-nums">
            {stats.foundCount}/{stats.totalCards}
          </p>
          <p className="text-[11px] sm:text-xs text-chocobo-muted mt-1 tabular-nums">
            {stats.foundPercentage.toFixed(1)}% &middot; {stats.remainingCount} unpulled
          </p>
        </div>

        <div className="bg-chocobo-surface p-3.5 sm:p-4 rounded-lg border border-chocobo-gold/30">
          <p className="text-[11px] sm:text-xs font-medium text-chocobo-muted">Median Sale</p>
          <p className="font-display text-xl sm:text-3xl font-bold text-emerald-400 mt-1 sm:mt-1.5 tabular-nums">
            ${Math.round(stats.medianPrice).toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-chocobo-muted mt-1">
            Across {stats.pricedCount} priced {stats.pricedCount === 1 ? 'card' : 'cards'}
          </p>
        </div>

        <div className="bg-chocobo-surface p-3.5 sm:p-4 rounded-lg border border-chocobo-gold/30">
          <p className="text-[11px] sm:text-xs font-medium text-chocobo-muted">Average Sale</p>
          <p className="font-display text-xl sm:text-3xl font-bold text-chocobo-gold mt-1 sm:mt-1.5 tabular-nums">
            ${Math.round(stats.averagePrice).toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-chocobo-muted mt-1 tabular-nums">
            {stats.pricedCount > 0
              ? `${formatCompactUsd(stats.lowestPrice)} – ${formatCompactUsd(stats.highestPrice)}`
              : 'No sales logged'}
          </p>
        </div>

        <div className="bg-chocobo-surface p-3.5 sm:p-4 rounded-lg border border-chocobo-gold/30">
          <p className="text-[11px] sm:text-xs font-medium text-chocobo-muted">Graded Pop</p>
          <p className="font-display text-xl sm:text-3xl font-bold text-sky-400 mt-1 sm:mt-1.5 tabular-nums">
            {stats.gradingStats.totalGraded}
          </p>
          <p className="text-[11px] sm:text-xs text-chocobo-muted mt-1 tabular-nums">
            Avg Grade: {stats.gradingStats.averageGrade.toFixed(1)}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-chocobo-surface p-3.5 sm:p-4 rounded-lg border border-chocobo-gold/30">
          <p className="text-[11px] sm:text-xs font-medium text-chocobo-muted">Pull Pace</p>
          <p className="font-display text-xl sm:text-3xl font-bold text-chocobo-gold mt-1 sm:mt-1.5 tabular-nums">
            {stats.discoveryVelocity.avgDaysBetweenPulls !== null
              ? `${stats.discoveryVelocity.avgDaysBetweenPulls.toFixed(1)}d`
              : '—'}
          </p>
          <p className="text-[11px] sm:text-xs text-chocobo-muted mt-1 tabular-nums">
            {stats.discoveryVelocity.daysSinceLastPull !== null
              ? `${stats.discoveryVelocity.daysSinceLastPull}d since last pull`
              : 'Avg days between pulls'}
          </p>
        </div>
      </div>

      {tracker.series.length > 1 && (
        <section
          aria-label="Progress by series"
          className="bg-chocobo-surface p-5 sm:p-6 rounded-lg border border-chocobo-gold/25"
        >
          <h2 className="font-display text-lg sm:text-xl font-bold text-chocobo-gold mb-4">
            Progress by Series
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracker.series.map((s) => {
              const pct = s.totalCount > 0 ? (s.foundCount / s.totalCount) * 100 : 0;
              return (
                <div
                  key={s.id}
                  className="bg-chocobo-recessed border border-chocobo-gold/20 rounded-md p-4 space-y-2"
                >
                  <p className="font-display font-bold text-chocobo-gold">{s.name}</p>
                  <p className="text-xs text-chocobo-muted tabular-nums">
                    <span className="text-chocobo-light font-semibold">{s.foundCount}</span> /{' '}
                    {s.totalCount} found ({pct.toFixed(1)}%)
                  </p>
                  <div className="w-full h-1.5 rounded-full bg-chocobo-dark border border-chocobo-gold/20 overflow-hidden">
                    <div
                      className="h-full bg-chocobo-gold rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {stats.foundCount > 0 ? (
        <StatsCharts
          priceRanges={stats.priceRanges}
          findsByMonth={stats.findsByMonth}
          priceHistory={stats.priceHistory}
          gradingStats={stats.gradingStats}
          pullChannelDistribution={stats.pullChannelDistribution}
          regionDistribution={stats.regionDistribution}
        />
      ) : (
        <div className="bg-chocobo-surface border border-chocobo-gold/20 rounded-lg text-center py-12 text-chocobo-muted text-sm">
          No discoveries logged yet for this tracker.
        </div>
      )}
    </main>
  );
}
