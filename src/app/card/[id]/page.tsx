import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import AffiliateLinks from '@/components/AffiliateLinks';
import { resolveCardLinks } from '@/lib/affiliate';
import { getResolvedCardById } from '@/lib/redis-cards';
import { getSiteUrl } from '@/lib/site-config';
import { TOTAL_CHOCOBO_CARDS } from '@/lib/validation';

export const revalidate = 300;

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

  const card = await getResolvedCardById(parsed.id);
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
  const ogImage = card.resolvedImage || '/images/chocobo-01.jpg';

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
      images: [{ url: ogImage, alt: `Golden Chocobo Card #${parsed.padded}/77` }],
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

  const card = await getResolvedCardById(parsed.id);
  if (!card) {
    notFound();
  }

  const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
    resolveCardLinks(card);

  const prevId = (parsed.id === 1 ? TOTAL_CHOCOBO_CARDS : parsed.id - 1).toString().padStart(2, '0');
  const nextId = (parsed.id === TOTAL_CHOCOBO_CARDS ? 1 : parsed.id + 1).toString().padStart(2, '0');

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
      <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
        <div className="w-full max-w-4xl space-y-8">
          <nav
            aria-label="Breadcrumb and card navigation"
            className="flex flex-wrap items-center justify-between gap-4 text-sm font-mono"
          >
            <Link href="/" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
              &larr; All 77 Cards
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={`/card/${prevId}`}
                className="text-chocobo-gold hover:text-yellow-400 transition-colors"
              >
                &larr; #{prevId}
              </Link>
              <Link
                href={`/card/${nextId}`}
                className="text-chocobo-gold hover:text-yellow-400 transition-colors"
              >
                #{nextId} &rarr;
              </Link>
            </div>
          </nav>

          <article className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="w-full">
              {card.resolvedImage ? (
                <div className="relative aspect-[3/4] w-full bg-black/30 rounded-lg overflow-hidden border border-chocobo-gold/40">
                  <Image
                    src={card.resolvedImage}
                    alt={`Golden Chocobo Card #${parsed.padded} of 77`}
                    fill
                    priority
                    sizes="(max-width: 768px) 92vw, 400px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] w-full rounded-lg border border-chocobo-gold/30 bg-gradient-to-b from-chocobo-gold/15 via-black/40 to-black/60 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-5xl font-bold text-chocobo-gold/80 tabular-nums">
                    #{parsed.padded}
                  </span>
                  <span className="text-sm uppercase tracking-widest text-chocobo-light/70 mt-3">
                    {card.found ? 'Photo Pending' : 'Undiscovered'}
                  </span>
                  <span className="text-xs text-chocobo-gold/70 mt-1">Serialized / 77</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-chocobo-gold tabular-nums">
                    Golden Chocobo #{parsed.padded}/77
                  </h1>
                  <span
                    className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${
                      card.found
                        ? 'bg-green-800/60 text-green-300'
                        : 'bg-gray-700/60 text-gray-300'
                    }`}
                  >
                    {card.found ? 'Found' : 'Not Found'}
                  </span>
                </div>
                <p className="text-sm text-chocobo-light/75 mt-1">
                  Magic: The Gathering &times; Final Fantasy — Serialized Traveling Chocobo
                </p>
              </div>

              <section aria-label="Discovery details" className="bg-chocobo-light/10 p-4 rounded space-y-2">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold">
                  Discovery Details
                </h2>
                {card.found ? (
                  <>
                    <p className="text-chocobo-light">
                      <span className="font-bold">Found by:</span> {card.foundBy || 'Unknown'}
                    </p>
                    {card.dateFound && (
                      <p className="text-chocobo-light">
                        <span className="font-bold">Date found:</span> {card.dateFound}
                      </p>
                    )}
                    {pullSourceUrl && (
                      <p className="text-chocobo-light">
                        <span className="font-bold">Pull Source:</span>{' '}
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
                        <span className="font-bold">Marketplace Listing:</span>{' '}
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
                  <p className="text-chocobo-light/85 text-sm">
                    This serialized copy has not yet been reported pulled.
                  </p>
                )}
              </section>

              {typeof card.price === 'number' && (
                <section aria-label="Reported sale price" className="bg-chocobo-light/10 p-4 rounded">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold">
                    Latest Reported Sale
                  </h2>
                  <p className="text-2xl font-bold text-green-400 tabular-nums mt-1">
                    ${card.price.toLocaleString()}
                  </p>
                  {card.priceDate && (
                    <p className="text-xs text-chocobo-light/75 mt-0.5">
                      Reported {card.priceDate}
                    </p>
                  )}
                </section>
              )}

              {card.grading && (
                <section aria-label="Grading details" className="bg-chocobo-light/10 p-4 rounded">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold">
                    Grading
                  </h2>
                  <p className="text-xl font-bold text-blue-400 mt-1">
                    {card.grading.service} {card.grading.grade}
                  </p>
                  {card.grading.certNumber && (
                    <p className="text-sm text-chocobo-light">Cert #: {card.grading.certNumber}</p>
                  )}
                  {card.grading.dateGraded && (
                    <p className="text-xs text-chocobo-light/75">
                      Graded on {card.grading.dateGraded}
                    </p>
                  )}
                </section>
              )}

              {card.priceHistory && card.priceHistory.length > 0 && (
                <section aria-label="Price history" className="bg-chocobo-light/10 p-4 rounded">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold mb-2">
                    Sale History
                  </h2>
                  <div className="space-y-2">
                    {card.priceHistory.map((entry, idx) => (
                      <div
                        key={`${entry.date}-${entry.price}-${idx}`}
                        className="flex justify-between items-start border-b border-chocobo-gold/25 pb-2 last:border-b-0 last:pb-0 text-sm"
                      >
                        <div>
                          <p className="text-green-400 font-bold tabular-nums">
                            ${entry.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-chocobo-light/75">{entry.date}</p>
                        </div>
                        <div className="text-right text-xs text-chocobo-light/75">
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

        <AffiliateLinks />
      </main>
    </>
  );
}
