import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TrackerAffiliateSection from '@/components/TrackerAffiliateSection';
import { resolveCardLinks } from '@/lib/affiliate';
import { getHydratedTracker } from '@/lib/multi-tracker';

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

  const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
    resolveCardLinks(card);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <div className="w-full max-w-4xl space-y-8">
        <nav className="flex flex-wrap items-center justify-between gap-4 text-sm font-mono">
          <Link href={`/t/${tracker.slug}`} className="text-chocobo-gold hover:text-yellow-400">
            &larr; {tracker.name}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/t/${tracker.slug}/card/${prevNum.toString().padStart(padWidth, '0')}${seriesSuffix}`}
              className="text-chocobo-gold hover:text-yellow-400"
            >
              &larr; #{prevNum.toString().padStart(padWidth, '0')}
            </Link>
            <Link
              href={`/t/${tracker.slug}/card/${nextNum.toString().padStart(padWidth, '0')}${seriesSuffix}`}
              className="text-chocobo-gold hover:text-yellow-400"
            >
              #{nextNum.toString().padStart(padWidth, '0')} &rarr;
            </Link>
          </div>
        </nav>

        <article className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="w-full">
            {card.resolvedImage ? (
              <div className="relative aspect-[3/4] w-full bg-black/30 rounded-lg overflow-hidden border border-chocobo-gold/40">
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
              <div className="aspect-[3/4] w-full rounded-lg border border-chocobo-gold/30 bg-gradient-to-b from-chocobo-gold/15 via-black/40 to-black/60 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl font-bold text-chocobo-gold/80 tabular-nums">
                  #{padded}
                </span>
                <span className="text-sm uppercase tracking-widest text-chocobo-light/70 mt-3">
                  {card.found ? 'Photo Pending' : 'Undiscovered'}
                </span>
                <span className="text-xs text-chocobo-gold/70 mt-1">
                  Serialized / {activeSeries.serialMax}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-chocobo-gold tabular-nums">
                {activeSeries.name} #{padded}/{activeSeries.serialMax}
              </h1>
              <p className="text-sm text-chocobo-light/75 mt-1">{tracker.setName}</p>
              <div className="pt-3">
                <Link
                  href={`/t/${tracker.slug}/submit?series=${encodeURIComponent(activeSeries.slug)}&card=${serialNum}`}
                  className="inline-block border border-chocobo-gold/80 hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold text-xs font-bold py-1.5 px-3 rounded transition-colors"
                >
                  Suggest Update for #{padded} &rarr;
                </Link>
              </div>
            </div>

            <section className="bg-chocobo-light/10 p-4 rounded space-y-2">
              <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold">
                Discovery Details
              </h2>
              {card.found ? (
                <>
                  <p>
                    <span className="font-bold">Found by:</span> {card.foundBy || 'Unknown'}
                  </p>
                  {card.dateFound && (
                    <p>
                      <span className="font-bold">Date found:</span> {card.dateFound}
                    </p>
                  )}
                  {pullSourceUrl && (
                    <p>
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
                    <p>
                      <span className="font-bold">Marketplace:</span>{' '}
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
                <p className="text-sm text-chocobo-light/85">
                  Not yet reported pulled.
                </p>
              )}
            </section>

            {typeof card.price === 'number' && (
              <section className="bg-chocobo-light/10 p-4 rounded">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold">
                  Latest Reported Sale
                </h2>
                <p className="text-2xl font-bold text-green-400 tabular-nums mt-1">
                  ${card.price.toLocaleString()}
                </p>
                {card.priceDate && (
                  <p className="text-xs text-chocobo-light/75 mt-0.5">Reported {card.priceDate}</p>
                )}
              </section>
            )}

            {card.grading && (
              <section className="bg-chocobo-light/10 p-4 rounded">
                <h2 className="text-sm uppercase tracking-wider font-bold text-chocobo-gold">
                  Grading
                </h2>
                <p className="text-xl font-bold text-blue-400 mt-1">
                  {card.grading.service} {card.grading.grade}
                </p>
                {card.grading.certNumber && (
                  <p className="text-sm">Cert #: {card.grading.certNumber}</p>
                )}
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
