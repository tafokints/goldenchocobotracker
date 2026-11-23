import type { Metadata } from 'next';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';
import { listPublishedTrackers } from '@/lib/multi-tracker';
import { DEFAULT_TRACKER_SLUG } from '@/lib/tracker-store';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Serialized Card Trackers Hub',
  description:
    'Browse live community trackers for Magic: The Gathering and serialized collectible card runs, including pull progress, reported sales, and grading analytics.',
  alternates: {
    canonical: '/hub',
  },
};

export default async function HubPage() {
  const trackerList = await listPublishedTrackers();

  return (
    <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-8 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 border-b border-chocobo-gold/20 pb-3.5 sm:pb-4">
        <div>
          <h1 className="font-display text-xl sm:text-3xl font-bold text-chocobo-gold">
            Serialized Card Trackers
          </h1>
          <p className="text-xs sm:text-sm text-chocobo-muted mt-1">
            Community-verified pull tracking, grading logs, and reported sale histories.
          </p>
        </div>
        <Link
          href="/admin/trackers"
          className="inline-flex items-center justify-center min-h-[38px] sm:min-h-0 text-xs border border-chocobo-light/15 hover:border-chocobo-gold/50 text-chocobo-muted hover:text-chocobo-light px-3 py-2 sm:py-1.5 rounded transition-colors"
        >
          Manage Trackers
        </Link>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5" aria-label="Published trackers">
        {trackerList.map((tracker) => {
          const href = tracker.slug === DEFAULT_TRACKER_SLUG ? '/' : `/t/${tracker.slug}`;
          const statsHref =
            tracker.slug === DEFAULT_TRACKER_SLUG ? '/stats' : `/t/${tracker.slug}/stats`;

          return (
            <article
              key={tracker.id}
              className="bg-chocobo-surface border rounded-lg p-4 sm:p-6 flex flex-col justify-between gap-4 transition-all hover:border-chocobo-gold hover:-translate-y-0.5"
              style={{ borderColor: `${tracker.accentHex}4D` }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-gold">
                    {tracker.game}
                  </span>
                  <span className="text-xs text-chocobo-muted tabular-nums">
                    {tracker.seriesCount} series &middot; {tracker.totalSerials.toLocaleString()}{' '}
                    serials
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold" style={{ color: tracker.accentHex }}>
                  <Link href={href} className="hover:underline">
                    {tracker.name}
                  </Link>
                </h2>
                <p className="text-xs text-chocobo-muted">{tracker.setName}</p>
                <p className="text-sm text-chocobo-light/85 leading-relaxed">
                  {tracker.description}
                </p>
              </div>

              <div className="space-y-4">
                <ProgressBar current={tracker.foundCount} total={tracker.totalSerials} />
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={href}
                    className="flex-1 text-center bg-chocobo-gold hover:bg-chocobo-gold-bright text-chocobo-dark font-semibold py-2 px-4 rounded-md text-sm transition-colors"
                  >
                    Open Tracker &rarr;
                  </Link>
                  <Link
                    href={statsHref}
                    className="border border-chocobo-gold/55 hover:border-chocobo-gold hover:bg-chocobo-gold/10 text-chocobo-gold font-semibold py-2 px-4 rounded-md text-sm transition-colors"
                  >
                    Stats
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
