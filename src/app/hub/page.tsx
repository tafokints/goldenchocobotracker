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
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 mb-8 font-mono text-sm">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold">
            Serialized Card Trackers
          </h1>
          <p className="text-xs sm:text-sm text-chocobo-light/80 mt-1">
            Community-verified pull tracking, grading logs, and reported sale histories.
          </p>
        </div>
        <Link href="/admin/trackers" className="text-chocobo-light/70 hover:text-chocobo-gold text-xs">
          Manage Trackers
        </Link>
      </header>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Published trackers">
        {trackerList.map((tracker) => {
          const href = tracker.slug === DEFAULT_TRACKER_SLUG ? '/' : `/t/${tracker.slug}`;
          return (
            <article
              key={tracker.id}
              className="bg-chocobo-dark border rounded-lg p-6 flex flex-col justify-between gap-4 shadow-[0_0_15px_rgba(214,167,61,0.25)]"
              style={{ borderColor: tracker.accentHex }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-chocobo-gold/20 text-chocobo-gold">
                    {tracker.game}
                  </span>
                  <span className="text-xs text-chocobo-light/70">
                    {tracker.seriesCount} {tracker.seriesCount === 1 ? 'series' : 'series'}
                  </span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: tracker.accentHex }}>
                  <Link href={href} className="hover:underline">
                    {tracker.name}
                  </Link>
                </h2>
                <p className="text-xs text-chocobo-light/75">{tracker.setName}</p>
                <p className="text-sm text-chocobo-light/90">{tracker.description}</p>
              </div>

              <div className="space-y-4">
                <ProgressBar current={tracker.foundCount} total={tracker.totalSerials} />
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={href}
                    className="flex-1 text-center bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded text-sm transition-colors"
                  >
                    Open Tracker &rarr;
                  </Link>
                  <Link
                    href={tracker.slug === DEFAULT_TRACKER_SLUG ? '/stats' : `/t/${tracker.slug}/stats`}
                    className="border border-chocobo-gold/70 hover:bg-chocobo-gold/15 text-chocobo-gold font-semibold py-2 px-4 rounded text-sm transition-colors"
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
