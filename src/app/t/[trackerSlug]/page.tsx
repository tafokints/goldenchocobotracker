import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MultiTrackerGrid from '@/components/MultiTrackerGrid';
import ProgressBar from '@/components/ProgressBar';
import TrackerAffiliateSection from '@/components/TrackerAffiliateSection';
import { getHydratedTracker } from '@/lib/multi-tracker';
import { getSiteUrl } from '@/lib/site-config';

export const revalidate = 300;

interface TrackerPageProps {
  params: Promise<{ trackerSlug: string }>;
}

export async function generateMetadata({ params }: TrackerPageProps): Promise<Metadata> {
  const { trackerSlug } = await params;
  const tracker = await getHydratedTracker(trackerSlug);
  if (!tracker) {
    return { title: 'Tracker Not Found' };
  }

  return {
    title: tracker.name,
    description: tracker.description,
    alternates: {
      canonical: `/t/${tracker.slug}`,
    },
    openGraph: {
      title: `${tracker.name} | Serialized Card Tracker`,
      description: tracker.description,
      url: `${getSiteUrl()}/t/${tracker.slug}`,
    },
  };
}

export default async function DynamicTrackerPage({ params }: TrackerPageProps) {
  const { trackerSlug } = await params;
  const tracker = await getHydratedTracker(trackerSlug);
  if (!tracker || !tracker.isPublished) {
    notFound();
  }

  const totalCount = tracker.series.reduce((sum, s) => sum + s.totalCount, 0);
  const foundCount = tracker.series.reduce((sum, s) => sum + s.foundCount, 0);

  return (
    <main
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-8 space-y-3 sm:space-y-4"
      style={
        {
          '--tracker-accent': tracker.themeConfig.accentHex,
          '--tracker-bg': tracker.themeConfig.bgHex,
          '--tracker-fg': tracker.themeConfig.fgHex,
        } as React.CSSProperties
      }
    >
      {/* Compact Hero + Progress Band */}
      <section
        aria-label="Overall tracker progress"
        className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center bg-chocobo-surface border border-chocobo-gold/25 rounded-lg px-3.5 py-3 sm:px-5 sm:py-4"
      >
        <div className="lg:col-span-6 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-gold">
              {tracker.game}
            </span>
            <span className="text-xs text-chocobo-muted">{tracker.setName}</span>
          </div>
          <h1
            className="font-display text-xl sm:text-3xl font-bold tracking-wide text-chocobo-gold leading-tight"
            style={{ color: tracker.themeConfig.accentHex }}
          >
            {tracker.name}
          </h1>
          {tracker.description && (
            <p className="text-xs sm:text-sm text-chocobo-muted">{tracker.description}</p>
          )}
        </div>

        <div className="lg:col-span-6 space-y-2.5 sm:space-y-3">
          <ProgressBar current={foundCount} total={totalCount} />
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end gap-2 text-xs">
            <Link
              href={`/t/${tracker.slug}/stats`}
              className="inline-flex items-center justify-center min-h-[38px] sm:min-h-0 border border-chocobo-light/15 hover:border-chocobo-gold/50 text-chocobo-muted hover:text-chocobo-light py-1.5 px-3 rounded transition-colors"
            >
              Tracker Stats
            </Link>
            <Link
              href={`/t/${tracker.slug}/submit`}
              className="inline-flex items-center justify-center min-h-[38px] sm:min-h-0 border border-chocobo-gold/60 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-semibold py-1.5 px-3 rounded transition-colors"
            >
              Submit Update
            </Link>
          </div>
        </div>
      </section>

      <MultiTrackerGrid trackerSlug={tracker.slug} seriesList={tracker.series} />

      <TrackerAffiliateSection
        setName={tracker.setName}
        affiliateLinksEnabled={tracker.affiliateLinksEnabled}
        affiliateLinks={tracker.affiliateConfig}
        communityLinks={tracker.communityLinks}
      />
    </main>
  );
}
