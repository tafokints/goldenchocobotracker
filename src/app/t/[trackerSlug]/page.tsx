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
      className="flex min-h-screen flex-col items-center p-6 md:p-12"
      style={
        {
          '--tracker-accent': tracker.themeConfig.accentHex,
          '--tracker-bg': tracker.themeConfig.bgHex,
          '--tracker-fg': tracker.themeConfig.fgHex,
        } as React.CSSProperties
      }
    >
      <header className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl md:text-4xl font-bold"
            style={{ color: tracker.themeConfig.accentHex }}
          >
            {tracker.name}
          </h1>
          <p className="text-xs text-chocobo-light/75 mt-1">{tracker.setName}</p>
        </div>
        <nav className="flex items-center flex-wrap gap-4" aria-label="Tracker navigation">
          <Link href="/hub" className="text-chocobo-light/80 hover:text-chocobo-gold">
            All Trackers
          </Link>
          <Link
            href={`/t/${tracker.slug}/stats`}
            className="text-chocobo-gold hover:text-yellow-400 font-semibold"
          >
            Stats
          </Link>
          <Link
            href={`/t/${tracker.slug}/submit`}
            className="text-chocobo-gold hover:text-yellow-400 font-semibold"
          >
            Submit Update
          </Link>
        </nav>
      </header>

      <section
        aria-label="Overall tracker progress"
        className="w-full max-w-5xl mt-6 text-center bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold/30"
      >
        <ProgressBar current={foundCount} total={totalCount} />
        <p className="text-chocobo-light/85 mt-3 text-sm">{tracker.description}</p>
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
