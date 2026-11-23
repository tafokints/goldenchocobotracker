import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyLinkButton from '@/components/CopyLinkButton';
import TrackerAffiliateSection from '@/components/TrackerAffiliateSection';
import { resolveCardLinks } from '@/lib/affiliate';
import { getGradingCertUrl } from '@/lib/grading-certs';
import { getHydratedTracker } from '@/lib/multi-tracker';
import { PULL_CHANNEL_LABELS, type ResolvedCard } from '@/lib/types';

export const revalidate = 300;

type GradingWithOptionalLabel = NonNullable<ResolvedCard['grading']> & { gradeLabel?: string };

function formatCardGrading(grading: GradingWithOptionalLabel): string {
  const cleanLabel = grading.gradeLabel?.trim();
  if (!cleanLabel) return `${grading.service} ${grading.grade}`;
  return cleanLabel.includes(String(grading.grade))
    ? `${grading.service} ${cleanLabel}`
    : `${grading.service} ${grading.grade} · ${cleanLabel}`;
}

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
    title: `${activeSeries.name} #${padded}/${activeSeries.serialMax}`,
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

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <nav
          aria-label="Breadcrumb and card navigation"
          className="flex flex-wrap items-center justify-between gap-4 text-sm"
        >
          <Link
            href={`/t/${tracker.slug}`}
            className="text-chocobo-muted hover:text-chocobo-gold transition-colors"
          >
            &larr; {tracker.name}
          </Link>
          <div className="flex items-center gap-4 tabular-nums">
            <Link
              href={`/t/${tracker.slug}/card/${prevNum.toString().padStart(padWidth, '0')}${seriesSuffix}`}
              className="text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
            >
              &larr; #{prevNum.toString().padStart(padWidth, '0')}
            </Link>
            <Link
              href={`/t/${tracker.slug}/card/${nextNum.toString().padStart(padWidth, '0')}${seriesSuffix}`}
              className="text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
            >
              #{nextNum.toString().padStart(padWidth, '0')} &rarr;
            </Link>
          </div>
        </nav>

        <article className="bg-chocobo-surface border border-chocobo-gold/40 rounded-lg p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="w-full">
            {card.resolvedImage ? (
              <div className="relative aspect-[3/4] w-full bg-black/35 rounded-lg overflow-hidden border border-chocobo-gold/35">
                <Image
                  src={card.resolvedImage}
                  alt={`${activeSeries.name} #${padded}/${activeSeries.serialMax}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 92vw, 400px"
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
                  className={`font-display text-5xl font-bold tabular-nums ${
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

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-chocobo-gold tabular-nums">
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
              </div>
              <p className="text-sm text-chocobo-muted mt-1">{tracker.setName}</p>
              <div className="pt-3 flex flex-wrap gap-2">
                <Link
                  href={`/t/${tracker.slug}/submit?series=${encodeURIComponent(activeSeries.slug)}&card=${serialNum}`}
                  className="inline-block border border-chocobo-gold/70 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold text-xs font-semibold py-1.5 px-3 rounded transition-colors"
                >
                  Suggest Update for #{padded} &rarr;
                </Link>
                <CopyLinkButton path={sharePath} label="Copy Share Link" />
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
                  {formatCardGrading(card.grading as GradingWithOptionalLabel)}
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
                      className="flex justify-between items-start py-2 first:pt-0 last:pb-0 text-sm"
                    >
                      <div>
                        <p className="text-emerald-400 font-semibold tabular-nums">
                          ${entry.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-chocobo-muted tabular-nums">{entry.date}</p>
                      </div>
                      <div className="text-right text-xs text-chocobo-muted">
                        {entry.soldBy && <p>From: {entry.soldBy}</p>}
                        {entry.soldTo && <p>To: {entry.soldTo}</p>}
                      </div>
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
