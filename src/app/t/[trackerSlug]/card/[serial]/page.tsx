import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyLinkButton from '@/components/CopyLinkButton';
import TrackerAffiliateSection from '@/components/TrackerAffiliateSection';
import { resolveCardLinks } from '@/lib/affiliate';
import { formatGradingDisplay } from '@/lib/grading';
import { getGradingCertUrl } from '@/lib/grading-certs';
import { getIconicLabel, normalizeIconicMap } from '@/lib/iconic-numbers';
import { getHydratedTracker } from '@/lib/multi-tracker';
import { PULL_CHANNEL_LABELS } from '@/lib/types';

export const revalidate = 300;

interface DynamicCardPageProps {
  params: Promise<{ trackerSlug: string; serial: string }>;
  searchParams: Promise<{ series?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: DynamicCardPageProps): Promise<Metadata> {
  const { trackerSlug, serial } = await params;
  const query = await searchParams;
  const tracker = await getHydratedTracker(trackerSlug);
  if (!tracker || tracker.series.length === 0) return { title: 'Card Not Found' };

  const activeSeries =
    (query.series && tracker.series.find((s) => s.slug === query.series)) || tracker.series[0];
  const serialNum = parseInt(serial, 10);
  if (!Number.isInteger(serialNum)) return { title: 'Card Not Found' };

  const padWidth = Math.max(2, activeSeries.serialMax.toString().length);
  const padded = serialNum.toString().padStart(padWidth, '0');

  return {
    title: {
      absolute: `${activeSeries.name} #${padded}/${activeSeries.serialMax} | ${tracker.name}`,
    },
    description: `Track ${activeSeries.name} #${padded} of ${activeSeries.serialMax} on ${tracker.name}.`,
  };
}

export default async function DynamicTrackerCardPage({
  params,
  searchParams,
}: DynamicCardPageProps) {
  const { trackerSlug, serial } = await params;
  const query = await searchParams;
  const tracker = await getHydratedTracker(trackerSlug);

  if (!tracker || !tracker.isPublished || tracker.series.length === 0) {
    notFound();
  }

  const activeSeries =
    (query.series && tracker.series.find((s) => s.slug === query.series)) || tracker.series[0];

  const serialNum = parseInt(serial, 10);
  if (
    !Number.isInteger(serialNum) ||
    serialNum < activeSeries.serialMin ||
    serialNum > activeSeries.serialMax
  ) {
    notFound();
  }

  const card = activeSeries.cards.find((c) => c.id === serialNum);
  if (!card) {
    notFound();
  }

  const padWidth = Math.max(2, activeSeries.serialMax.toString().length);
  const padded = serialNum.toString().padStart(padWidth, '0');
  const prevNum = serialNum === activeSeries.serialMin ? activeSeries.serialMax : serialNum - 1;
  const nextNum = serialNum === activeSeries.serialMax ? activeSeries.serialMin : serialNum + 1;
  const seriesSuffix =
    tracker.series.length > 1 ? `?series=${encodeURIComponent(activeSeries.slug)}` : '';
  const sharePath = `/t/${tracker.slug}/card/${padded}${seriesSuffix}`;

  const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
    resolveCardLinks(card);
  const certLookupUrl = getGradingCertUrl(card.grading?.service, card.grading?.certNumber);
  const iconicMap = normalizeIconicMap(tracker.seoConfig.iconicNumbers, {});
  const iconicLabel = getIconicLabel(card.id, iconicMap);

  return (
    <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-8 space-y-5 sm:space-y-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
        <nav
          aria-label="Breadcrumb and card navigation"
          className="flex items-center justify-between gap-2 text-xs sm:text-sm"
        >
          <Link
            href={`/t/${tracker.slug}`}
            className="inline-flex items-center min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-0 rounded-md sm:rounded-none border border-chocobo-gold/20 sm:border-0 bg-chocobo-surface sm:bg-transparent text-chocobo-muted hover:text-chocobo-gold transition-colors truncate"
          >
            &larr; {tracker.name}
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 tabular-nums shrink-0">
            <Link
              href={`/t/${tracker.slug}/card/${prevNum.toString().padStart(padWidth, '0')}${seriesSuffix}`}
              className="inline-flex items-center min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-0 rounded-md sm:rounded-none border border-chocobo-gold/25 sm:border-0 bg-chocobo-surface sm:bg-transparent text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
            >
              &larr; #{prevNum.toString().padStart(padWidth, '0')}
            </Link>
            <Link
              href={`/t/${tracker.slug}/card/${nextNum.toString().padStart(padWidth, '0')}${seriesSuffix}`}
              className="inline-flex items-center min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-0 rounded-md sm:rounded-none border border-chocobo-gold/25 sm:border-0 bg-chocobo-surface sm:bg-transparent text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
            >
              #{nextNum.toString().padStart(padWidth, '0')} &rarr;
            </Link>
          </div>
        </nav>

        <article className="bg-chocobo-surface border border-chocobo-gold/40 rounded-lg p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-start">
          <div className="w-full max-w-[240px] sm:max-w-[300px] md:max-w-none mx-auto">
            {card.resolvedImage ? (
              <div className="relative aspect-[3/4] w-full bg-black/35 rounded-lg overflow-hidden border border-chocobo-gold/35">
                <Image
                  src={card.resolvedImage}
                  alt={`${activeSeries.name} #${padded}/${activeSeries.serialMax}`}
                  fill
                  priority
                  sizes="(max-width: 640px) 240px, (max-width: 768px) 300px, 400px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div
                className={`aspect-[3/4] w-full rounded-lg border flex flex-col items-center justify-center p-6 text-center select-none ${
                  card.found
                    ? 'border-chocobo-gold/25 bg-chocobo-recessed/80'
                    : 'border-chocobo-light/10 bg-chocobo-dark/80'
                }`}
              >
                <span
                  className={`font-display text-4xl sm:text-5xl font-bold tabular-nums ${
                    card.found ? 'text-chocobo-gold/80' : 'text-chocobo-muted/45'
                  }`}
                >
                  #{padded}
                </span>
                <span className="text-xs uppercase tracking-widest text-chocobo-muted/70 mt-3">
                  {card.found ? 'Photo Pending' : 'Unpulled'}
                </span>
                <span className="text-xs text-chocobo-muted/50 mt-1 tabular-nums">
                  Serialized / {activeSeries.serialMax}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-chocobo-gold tabular-nums">
                  {activeSeries.name} #{padded}/{activeSeries.serialMax}
                </h1>
                <span
                  className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${
                    card.found
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-chocobo-muted border border-white/10'
                  }`}
                >
                  {card.found ? 'Found' : 'Unpulled'}
                </span>
                {iconicLabel && (
                  <span className="rounded px-2.5 py-0.5 text-xs font-medium bg-amber-950/80 border border-chocobo-gold/45 text-amber-200">
                    ★ {iconicLabel}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-chocobo-muted mt-1">{tracker.setName}</p>
              <div className="pt-3 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                <Link
                  href={`/t/${tracker.slug}/submit?series=${encodeURIComponent(activeSeries.slug)}&card=${serialNum}`}
                  className="inline-flex items-center justify-center min-h-[40px] sm:min-h-0 border border-chocobo-gold/70 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold text-xs font-semibold py-2 sm:py-1.5 px-3.5 sm:px-3 rounded transition-colors"
                >
                  Suggest Update for #{padded} &rarr;
                </Link>
                <CopyLinkButton
                  path={sharePath}
                  label="Copy Share Link"
                  className="inline-flex items-center justify-center min-h-[40px] sm:min-h-0 border border-chocobo-gold/60 hover:bg-chocobo-gold/15 text-chocobo-light text-xs font-semibold py-2 sm:py-1.5 px-3.5 sm:px-3 rounded transition-colors"
                />
              </div>
            </div>

            <section
              aria-label="Discovery details"
              className="bg-chocobo-recessed border border-chocobo-gold/20 p-4 rounded-md space-y-2 text-sm"
            >
              <h2 className="text-xs uppercase tracking-wider font-bold text-chocobo-gold">
                Discovery Details
              </h2>
              {card.found ? (
                <>
                  <p className="text-chocobo-light">
                    <span className="text-chocobo-muted">Found by:</span>{' '}
                    <span className="font-medium">{card.foundBy || 'Unknown'}</span>
                  </p>
                  {card.dateFound && (
                    <p className="text-chocobo-light tabular-nums">
                      <span className="text-chocobo-muted">Date found:</span> {card.dateFound}
                    </p>
                  )}
                  {card.pullChannel && (
                    <p className="text-chocobo-light">
                      <span className="text-chocobo-muted">Pull Origin:</span>{' '}
                      {PULL_CHANNEL_LABELS[card.pullChannel]}
                    </p>
                  )}
                  {card.region && (
                    <p className="text-chocobo-light">
                      <span className="text-chocobo-muted">Region:</span> {card.region}
                    </p>
                  )}
                  {pullSourceUrl && (
                    <p className="text-chocobo-light">
                      <span className="text-chocobo-muted">Pull Source:</span>{' '}
                      <a
                        href={pullSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-chocobo-gold hover:underline"
                      >
                        View Discovery Post
                      </a>
                    </p>
                  )}
                  {marketplaceUrl && (
                    <p className="text-chocobo-light">
                      <span className="text-chocobo-muted">Marketplace:</span>{' '}
                      <a
                        href={marketplaceUrl}
                        target="_blank"
                        rel={
                          isMarketplaceAffiliate
                            ? 'sponsored noopener noreferrer'
                            : 'noopener noreferrer'
                        }
                        className="text-chocobo-gold hover:underline"
                      >
                        View on {marketplaceLabel}
                        {isMarketplaceAffiliate ? ' (Paid Link)' : ''}
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-chocobo-muted">
                  This serialized copy has not yet been reported pulled.
                </p>
              )}
            </section>

            {typeof card.price === 'number' && (
              <section
                aria-label="Reported sale price"
                className="bg-chocobo-recessed border border-chocobo-gold/20 p-4 rounded-md"
              >
                <h2 className="text-xs uppercase tracking-wider font-bold text-chocobo-gold">
                  Latest Reported Sale
                </h2>
                <p className="font-display text-2xl font-bold text-emerald-400 tabular-nums mt-1">
                  ${card.price.toLocaleString()}
                </p>
                {card.priceDate && (
                  <p className="text-xs text-chocobo-muted tabular-nums mt-0.5">
                    Reported {card.priceDate}
                  </p>
                )}
              </section>
            )}

            {card.grading && (
              <section
                aria-label="Grading details"
                className="bg-chocobo-recessed border border-sky-400/25 p-4 rounded-md space-y-1"
              >
                <h2 className="text-xs uppercase tracking-wider font-bold text-chocobo-gold">
                  Grading
                </h2>
                <p className="text-lg font-bold text-sky-400 mt-1">
                  {formatGradingDisplay(card.grading)}
                </p>
                {card.grading.certNumber && (
                  <p className="text-sm text-chocobo-light tabular-nums">
                    <span className="text-chocobo-muted">Cert #:</span>{' '}
                    {certLookupUrl ? (
                      <a
                        href={certLookupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-chocobo-gold hover:underline font-semibold"
                      >
                        {card.grading.certNumber} (Verify &rarr;)
                      </a>
                    ) : (
                      card.grading.certNumber
                    )}
                  </p>
                )}
                {card.grading.dateGraded && (
                  <p className="text-xs text-chocobo-muted tabular-nums">
                    Graded on {card.grading.dateGraded}
                  </p>
                )}
              </section>
            )}

            {card.priceHistory && card.priceHistory.length > 0 && (
              <section
                aria-label="Price history"
                className="bg-chocobo-recessed border border-chocobo-gold/20 p-4 rounded-md"
              >
                <h2 className="text-xs uppercase tracking-wider font-bold text-chocobo-gold mb-2.5">
                  Sale History
                </h2>
                <div className="divide-y divide-chocobo-gold/15">
                  {card.priceHistory.map((entry, idx) => (
                    <div
                      key={`${entry.date}-${entry.price}-${idx}`}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 py-2.5 first:pt-0 last:pb-0 text-sm"
                    >
                      <div className="flex items-baseline justify-between sm:block gap-2">
                        <p className="text-emerald-400 font-semibold tabular-nums">
                          ${entry.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-chocobo-muted tabular-nums">{entry.date}</p>
                      </div>
                      {(entry.soldBy || entry.soldTo) && (
                        <div className="sm:text-right text-xs text-chocobo-muted space-y-0.5">
                          {entry.soldBy && <p>From: {entry.soldBy}</p>}
                          {entry.soldTo && <p>To: {entry.soldTo}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>

      <TrackerAffiliateSection
        setName={tracker.setName}
        affiliateLinksEnabled={tracker.affiliateLinksEnabled}
        affiliateLinks={tracker.affiliateConfig}
        communityLinks={tracker.communityLinks}
      />
    </main>
  );
}
