import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
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
            Community-verified pull tracking, grading logs, and reported sale histories across
            flagship serialized runs.
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
          const pct =
            tracker.totalSerials > 0 ? (tracker.foundCount / tracker.totalSerials) * 100 : 0;

          return (
            <article
              key={tracker.id}
              className="rounded-lg p-4 sm:p-6 flex flex-col justify-between gap-4 border transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: tracker.bgHex,
                borderColor: `${tracker.accentHex}55`,
              }}
            >
              <div className="flex items-start gap-3.5">
                {tracker.referenceImageUrl && (
                  <Link
                    href={href}
                    className="relative w-16 sm:w-20 aspect-[3/4] shrink-0 rounded overflow-hidden border bg-black/40"
                    style={{ borderColor: `${tracker.accentHex}66` }}
                    aria-label={`Open ${tracker.name}`}
                  >
                    <Image
                      src={tracker.referenceImageUrl}
                      alt={`${tracker.name} reference card`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                )}

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-black/35 border"
                      style={{
                        borderColor: `${tracker.accentHex}50`,
                        color: tracker.accentHex,
                      }}
                    >
                      {tracker.motifLabel || tracker.game}
                    </span>
                    <span className="text-xs text-chocobo-muted tabular-nums">
                      {tracker.seriesCount} series &middot; {tracker.totalSerials.toLocaleString()}{' '}
                      serials
                    </span>
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-bold" style={{ color: tracker.accentHex }}>
                    <Link href={href} className="hover:underline">
                      {tracker.name}
                    </Link>
                  </h2>
                  <p className="text-xs text-chocobo-muted">{tracker.setName}</p>
                  <p className="text-xs sm:text-sm text-chocobo-light/85 leading-relaxed">
                    {tracker.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <span
                      className="font-display text-sm font-bold tabular-nums"
                      style={{ color: tracker.accentHex }}
                    >
                      {tracker.foundCount} / {tracker.totalSerials} Found
                    </span>
                    <span className="text-xs font-semibold text-chocobo-muted tabular-nums">
                      {pct.toFixed(1)}% &middot;{' '}
                      {Math.max(0, tracker.totalSerials - tracker.foundCount)} unpulled
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2.5 bg-black/45 border overflow-hidden"
                    style={{ borderColor: `${tracker.accentHex}40` }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, tracker.foundCount > 0 ? 2 : 0)}%`,
                        backgroundColor: tracker.accentHex,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Link
                    href={href}
                    className="flex-1 inline-flex items-center justify-center min-h-[40px] text-center text-[#111014] font-semibold py-2 px-4 rounded-md text-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: tracker.accentHex }}
                  >
                    Open Tracker &rarr;
                  </Link>
                  <Link
                    href={statsHref}
                    className="inline-flex items-center justify-center min-h-[40px] border hover:bg-white/5 font-semibold py-2 px-4 rounded-md text-sm transition-colors"
                    style={{
                      borderColor: `${tracker.accentHex}88`,
                      color: tracker.accentHex,
                    }}
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
