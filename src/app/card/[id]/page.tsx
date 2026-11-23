import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import AffiliateLinks from '@/components/AffiliateLinks';
import CopyLinkButton from '@/components/CopyLinkButton';
import { resolveCardLinks } from '@/lib/affiliate';
import { formatCompactUsd } from '@/lib/format';
import { formatGradingDisplay } from '@/lib/grading';
import { getGradingCertUrl } from '@/lib/grading-certs';
import { getIconicLabel, isIconicNumber } from '@/lib/iconic-numbers';
import { getSiteUrl } from '@/lib/site-config';
import { getCardById, getCards } from '@/lib/tracker-store';
import { PULL_CHANNEL_LABELS } from '@/lib/types';
import { TOTAL_CHOCOBO_CARDS } from '@/lib/validation';

export const revalidate = 300;
export const dynamicParams = false;

interface CardPageProps {
  params: Promise<{ id: string }>;
}

function parseCardParam(rawId: string): { id: number; padded: string } | null {
  if (!/^\d{1,2}$/.test(rawId)) return null;
  const parsed = parseInt(rawId, 10);
  if (parsed < 1 || parsed > TOTAL_CHOCOBO_CARDS) return null;
  return { id: parsed, padded: parsed.toString().padStart(2, '0') };
}

export function generateStaticParams() {
  return Array.from({ length: TOTAL_CHOCOBO_CARDS }, (_, i) => ({
    id: (i + 1).toString().padStart(2, '0'),
  }));
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const parsed = parseCardParam(rawId);
  if (!parsed) {
    return { title: 'Card Not Found' };
  }

  const card = await getCardById(parsed.id);
  if (!card) {
    return { title: `Golden Chocobo #${parsed.padded}/77` };
  }

  const statusSummary = card.found
    ? `Found${card.foundBy ? ` by ${card.foundBy}` : ''}${
        typeof card.price === 'number' ? ` · Last reported sale $${card.price.toLocaleString()}` : ''
      }`
    : 'Not yet reported found';

  const title = `Golden Chocobo #${parsed.padded}/77`;
  const description = `Serialized Golden Chocobo #${parsed.padded} of 77 from MTG × Final Fantasy: ${statusSummary}. View pull details, grading, and reported sale history.`;
  const ogImage = `/api/og?card=${parsed.padded}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/card/${parsed.padded}`,
    },
    openGraph: {
      title: `${title} | Golden Chocobo Tracker`,
      description,
      url: `${getSiteUrl()}/card/${parsed.padded}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Golden Chocobo Card #${parsed.padded}/77` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Golden Chocobo Tracker`,
      description,
      images: [ogImage],
    },
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const { id: rawId } = await params;
  const parsed = parseCardParam(rawId);
  if (!parsed) {
    notFound();
  }

  if (rawId !== parsed.padded) {
    permanentRedirect(`/card/${parsed.padded}`);
  }

  const allCards = await getCards();
  const card = allCards.find((item) => item.id === parsed.id) ?? null;
  if (!card) {
    notFound();
  }

  const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
    resolveCardLinks(card);
  const iconicLabel = getIconicLabel(card.id);
  const certLookupUrl = getGradingCertUrl(card.grading?.service, card.grading?.certNumber);

  const prevId = (parsed.id === 1 ? TOTAL_CHOCOBO_CARDS : parsed.id - 1).toString().padStart(2, '0');
  const nextId = (parsed.id === TOTAL_CHOCOBO_CARDS ? 1 : parsed.id + 1).toString().padStart(2, '0');

  const nearbyFoundCards = allCards
    .filter((item) => item.found && item.id !== parsed.id)
    .sort((a, b) => {
      const distDiff = Math.abs(a.id - parsed.id) - Math.abs(b.id - parsed.id);
      return distDiff !== 0 ? distDiff : a.id - b.id;
    })
    .slice(0, 4)
    .sort((a, b) => a.id - b.id);

  const totalUnpulledGrailsCount = allCards.filter(
    (item) => !item.found && isIconicNumber(item.id)
  ).length;
  const unpulledGrails = allCards.filter(
    (item) => item.id !== parsed.id && !item.found && isIconicNumber(item.id)
  );
  const displayedGrails =
    unpulledGrails.length > 0
      ? unpulledGrails
      : allCards.filter((item) => item.id !== parsed.id && isIconicNumber(item.id)).slice(0, 6);
  const currentIsUnpulledGrail = !card.found && isIconicNumber(card.id);

  const siteUrl = getSiteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Golden Chocobo #${parsed.padded}/77`,
    url: `${siteUrl}/card/${parsed.padded}`,
    description: card.found
      ? `Serialized Golden Chocobo #${parsed.padded}/77 reported found${card.foundBy ? ` by ${card.foundBy}` : ''}.`
      : `Serialized Golden Chocobo #${parsed.padded}/77 has not been reported found yet.`,
    ...(card.resolvedImage
      ? {
          primaryImageOfPage: card.resolvedImage.startsWith('http')
            ? card.resolvedImage
            : `${siteUrl}${card.resolvedImage}`,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-8 space-y-5 sm:space-y-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <nav
            aria-label="Breadcrumb and card navigation"
            className="flex items-center justify-between gap-2 text-xs sm:text-sm"
          >
            <Link
              href="/"
              className="inline-flex items-center min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-0 rounded-md sm:rounded-none border border-chocobo-gold/20 sm:border-0 bg-chocobo-surface sm:bg-transparent text-chocobo-muted hover:text-chocobo-gold transition-colors"
            >
              &larr; All 77 Cards
            </Link>
            <div className="flex items-center gap-2 sm:gap-4 tabular-nums">
              <Link
                href={`/card/${prevId}`}
                className="inline-flex items-center min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-0 rounded-md sm:rounded-none border border-chocobo-gold/25 sm:border-0 bg-chocobo-surface sm:bg-transparent text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
              >
                &larr; #{prevId}
              </Link>
              <Link
                href={`/card/${nextId}`}
                className="inline-flex items-center min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-0 rounded-md sm:rounded-none border border-chocobo-gold/25 sm:border-0 bg-chocobo-surface sm:bg-transparent text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
              >
                #{nextId} &rarr;
              </Link>
            </div>
          </nav>

          <article className="bg-chocobo-surface border border-chocobo-gold/40 rounded-lg p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-start">
            <div className="w-full max-w-[240px] sm:max-w-[300px] md:max-w-none mx-auto">
              {card.resolvedImage ? (
                <div className="relative aspect-[3/4] w-full bg-black/35 rounded-lg overflow-hidden border border-chocobo-gold/35">
                  <Image
                    src={card.resolvedImage}
                    alt={`Golden Chocobo Card #${parsed.padded} of 77`}
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
                      : 'border-chocobo-light/10 bg-chocobo-dark/85'
                  }`}
                >
                  <span
                    className={`font-display text-4xl sm:text-5xl font-bold tabular-nums ${
                      card.found ? 'text-chocobo-gold/80' : 'text-chocobo-muted/45'
                    }`}
                  >
                    #{parsed.padded}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-chocobo-muted/70 mt-3">
                    {card.found ? 'Photo Pending' : 'Unpulled'}
                  </span>
                  <span className="text-xs text-chocobo-muted/50 mt-1">Serialized / 77</span>
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-chocobo-gold tabular-nums">
                    Golden Chocobo #{parsed.padded}/77
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
                    <span className="inline-block rounded px-2.5 py-0.5 text-xs font-medium bg-amber-950/75 border border-chocobo-gold/40 text-amber-200">
                      ★ {iconicLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-chocobo-muted mt-1">
                  Magic: The Gathering &times; Final Fantasy &mdash; Serialized Traveling Chocobo
                </p>
                <div className="pt-3 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                  <Link
                    href={`/submit?card=${parsed.padded}`}
                    className="inline-flex items-center justify-center min-h-[40px] sm:min-h-0 border border-chocobo-gold/75 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold text-xs font-semibold py-2 sm:py-1.5 px-3.5 sm:px-3 rounded transition-colors"
                  >
                    Suggest Update for #{parsed.padded} &rarr;
                  </Link>
                  <CopyLinkButton
                    path={`/card/${parsed.padded}`}
                    label="Copy Share Link"
                    className="inline-flex items-center justify-center min-h-[40px] sm:min-h-0 border border-chocobo-gold/60 hover:bg-chocobo-gold/15 text-chocobo-light text-xs font-semibold py-2 sm:py-1.5 px-3.5 sm:px-3 rounded transition-colors"
                  />
                </div>
              </div>

              <section
                aria-label="Discovery details"
                className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md space-y-2 text-sm"
              >
                <h2 className="font-sans text-xs uppercase tracking-wider font-semibold text-chocobo-gold">
                  Discovery Details
                </h2>
                {card.found ? (
                  <>
                    <p className="text-chocobo-light">
                      <span className="text-chocobo-muted font-medium">Found by:</span>{' '}
                      {card.foundBy || 'Unknown'}
                    </p>
                    {card.dateFound && (
                      <p className="text-chocobo-light tabular-nums">
                        <span className="text-chocobo-muted font-medium">Date found:</span>{' '}
                        {card.dateFound}
                      </p>
                    )}
                    {card.pullChannel && (
                      <p className="text-chocobo-light">
                        <span className="text-chocobo-muted font-medium">Pull Origin:</span>{' '}
                        {PULL_CHANNEL_LABELS[card.pullChannel]}
                      </p>
                    )}
                    {card.region && (
                      <p className="text-chocobo-light">
                        <span className="text-chocobo-muted font-medium">Region:</span>{' '}
                        {card.region}
                      </p>
                    )}
                    {pullSourceUrl && (
                      <p className="text-chocobo-light">
                        <span className="text-chocobo-muted font-medium">Pull Source:</span>{' '}
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
                        <span className="text-chocobo-muted font-medium">Marketplace Listing:</span>{' '}
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
                  <p className="text-chocobo-muted text-sm">
                    This serialized copy has not yet been reported pulled.
                  </p>
                )}
              </section>

              {typeof card.price === 'number' && (
                <section
                  aria-label="Reported sale price"
                  className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md"
                >
                  <h2 className="font-sans text-xs uppercase tracking-wider font-semibold text-chocobo-gold">
                    Latest Reported Sale
                  </h2>
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums mt-1">
                    ${card.price.toLocaleString()}
                  </p>
                  {card.priceDate && (
                    <p className="text-xs text-chocobo-muted mt-0.5 tabular-nums">
                      Reported {card.priceDate}
                    </p>
                  )}
                </section>
              )}

              {card.grading && (
                <section
                  aria-label="Grading details"
                  className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md space-y-1"
                >
                  <h2 className="font-sans text-xs uppercase tracking-wider font-semibold text-chocobo-gold">
                    Grading
                  </h2>
                  <p className="text-xl font-bold text-sky-300 tabular-nums mt-1">
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
                  className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md"
                >
                  <h2 className="font-sans text-xs uppercase tracking-wider font-semibold text-chocobo-gold mb-2">
                    Sale History
                  </h2>
                  <div className="space-y-2.5">
                    {card.priceHistory.map((entry, idx) => (
                      <div
                        key={`${entry.date}-${entry.price}-${idx}`}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 border-b border-chocobo-gold/20 pb-2.5 last:border-b-0 last:pb-0 text-sm"
                      >
                        <div className="flex items-baseline justify-between sm:block gap-2">
                          <p className="text-emerald-400 font-bold tabular-nums">
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

          {/* Discovery Continuity Strip */}
          {(nearbyFoundCards.length > 0 || displayedGrails.length > 0) && (
            <section
              aria-label="Explore nearby found cards and unpulled grails"
              className="bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold text-chocobo-gold">
                  Explore Nearby &amp; Unpulled Grails
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <Link
                    href="/?view=matrix"
                    className="inline-flex items-center min-h-[34px] sm:min-h-0 px-2.5 py-1 sm:p-0 rounded border border-chocobo-gold/20 sm:border-0 bg-chocobo-recessed sm:bg-transparent text-chocobo-muted hover:text-chocobo-gold transition-colors"
                  >
                    1–77 Wall &rarr;
                  </Link>
                  <Link
                    href="/?quick=unpulled-iconic"
                    className="inline-flex items-center min-h-[34px] sm:min-h-0 px-2.5 py-1 sm:p-0 rounded border border-chocobo-gold/30 sm:border-0 bg-chocobo-recessed sm:bg-transparent text-chocobo-gold hover:text-chocobo-gold-bright font-medium transition-colors"
                  >
                    Unpulled Grails &rarr;
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearbyFoundCards.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-chocobo-muted">
                      Nearby Found Cards
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {nearbyFoundCards.map((neighbor) => {
                        const neighborPadded = neighbor.id.toString().padStart(2, '0');
                        const neighborIconic = getIconicLabel(neighbor.id);

                        return (
                          <Link
                            key={neighbor.id}
                            href={`/card/${neighborPadded}`}
                            className="group rounded-md border border-chocobo-gold/20 bg-chocobo-recessed/80 hover:border-chocobo-gold/60 hover:bg-chocobo-gold/10 px-3 py-2 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-display text-sm font-bold text-chocobo-gold group-hover:text-chocobo-gold-bright tabular-nums">
                                #{neighborPadded}
                                {neighborIconic && (
                                  <span
                                    aria-label={neighborIconic}
                                    className="ml-1 text-xs text-amber-300 font-sans"
                                  >
                                    ★
                                  </span>
                                )}
                              </span>
                              {typeof neighbor.price === 'number' ? (
                                <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                                  {formatCompactUsd(neighbor.price)}
                                </span>
                              ) : neighbor.grading ? (
                                <span className="text-[11px] font-medium text-sky-300 tabular-nums">
                                  {neighbor.grading.service} {neighbor.grading.grade}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-chocobo-muted truncate mt-0.5 tabular-nums">
                              {neighbor.foundBy || neighbor.dateFound || 'Verified Pull'}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {displayedGrails.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-chocobo-muted tabular-nums">
                      {unpulledGrails.length > 0
                        ? currentIsUnpulledGrail
                          ? `Other Unpulled Grails (${unpulledGrails.length} more)`
                          : `Unpulled Iconic Grails (${totalUnpulledGrailsCount} left)`
                        : 'Iconic Grails'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displayedGrails.map((grail) => {
                        const grailPadded = grail.id.toString().padStart(2, '0');
                        const grailLabel = getIconicLabel(grail.id);

                        return (
                          <Link
                            key={grail.id}
                            href={`/card/${grailPadded}`}
                            className="inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-0 rounded-md border border-chocobo-gold/30 bg-chocobo-recessed/80 hover:border-chocobo-gold hover:bg-chocobo-gold/10 px-2.5 py-1.5 text-xs transition-colors"
                          >
                            <span className="text-amber-300 leading-none" aria-hidden="true">
                              ★
                            </span>
                            <span className="font-display font-bold text-chocobo-gold tabular-nums">
                              #{grailPadded}
                            </span>
                            {grailLabel && (
                              <span className="text-chocobo-light/85">{grailLabel}</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <AffiliateLinks />
      </main>
    </>
  );
}
