'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import type { SeriesWithCards } from '@/lib/multi-tracker';
import type { ResolvedCard } from '@/lib/types';
import FilterControls from './FilterControls';

const CardLightbox = dynamic(() => import('./CardLightbox'), { ssr: false });
const CardDetails = dynamic(() => import('./CardDetails'), { ssr: false });

const PAGE_SIZE = 48;

interface MultiTrackerGridProps {
  trackerSlug: string;
  seriesList: SeriesWithCards[];
}

export default function MultiTrackerGrid({ trackerSlug, seriesList }: MultiTrackerGridProps) {
  const [activeSeriesSlug, setActiveSeriesSlug] = useState(seriesList[0]?.slug || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('id-asc');
  const [page, setPage] = useState(1);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<ResolvedCard | null>(null);

  const activeSeries =
    seriesList.find((s) => s.slug === activeSeriesSlug) || seriesList[0];

  const hasMultipleSeries = seriesList.length > 1;
  const padWidth = activeSeries ? Math.max(2, activeSeries.serialMax.toString().length) : 2;

  const filteredAndSortedCards = useMemo(() => {
    if (!activeSeries) return [];
    const query = searchQuery.trim().toLowerCase();

    return [...activeSeries.cards]
      .filter((card) => {
        const paddedId = card.id.toString().padStart(padWidth, '0');
        const matchesSearch =
          !query ||
          paddedId.includes(query) ||
          card.id.toString().includes(query) ||
          (card.foundBy?.toLowerCase().includes(query) ?? false);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'found' && card.found) ||
          (statusFilter === 'not-found' && !card.found);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'id-desc':
            return b.id - a.id;
          case 'price-asc':
            return (a.price ?? Infinity) - (b.price ?? Infinity);
          case 'price-desc':
            return (b.price ?? -1) - (a.price ?? -1);
          case 'date-asc':
            return new Date(a.dateFound ?? 0).getTime() - new Date(b.dateFound ?? 0).getTime();
          case 'date-desc':
            return new Date(b.dateFound ?? 0).getTime() - new Date(a.dateFound ?? 0).getTime();
          case 'id-asc':
          default:
            return a.id - b.id;
        }
      });
  }, [activeSeries, padWidth, searchQuery, statusFilter, sortOrder]);

  const usePagination = filteredAndSortedCards.length > 80;
  const totalPages = usePagination ? Math.ceil(filteredAndSortedCards.length / PAGE_SIZE) : 1;
  const safePage = Math.min(page, totalPages);

  const visibleCards = useMemo(() => {
    if (!usePagination) return filteredAndSortedCards;
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredAndSortedCards.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedCards, safePage, usePagination]);

  const { lightboxSlides, cardIdToSlideIndex } = useMemo(() => {
    const slides: Array<{ src: string; alt: string }> = [];
    const indexMap = new Map<number, number>();

    for (const card of visibleCards) {
      if (card.resolvedImage) {
        indexMap.set(card.id, slides.length);
        slides.push({
          src: card.resolvedImage,
          alt: `${activeSeries?.name || 'Card'} #${card.id.toString().padStart(padWidth, '0')}`,
        });
      }
    }

    return { lightboxSlides: slides, cardIdToSlideIndex: indexMap };
  }, [activeSeries?.name, padWidth, visibleCards]);

  if (!activeSeries) {
    return null;
  }

  return (
    <>
      {hasMultipleSeries && (
        <div
          role="tablist"
          aria-label="Card Series"
          className="w-full max-w-5xl mt-6 flex flex-wrap justify-center gap-2"
        >
          {seriesList.map((s) => {
            const isSelected = s.slug === activeSeries.slug;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveSeriesSlug(s.slug);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors border ${
                  isSelected
                    ? 'bg-chocobo-gold text-chocobo-dark border-chocobo-gold'
                    : 'bg-chocobo-dark/75 text-chocobo-light border-chocobo-gold/40 hover:border-chocobo-gold'
                }`}
              >
                {s.name}{' '}
                <span className="opacity-85 tabular-nums">
                  ({s.foundCount}/{s.totalCount})
                </span>
              </button>
            );
          })}
        </div>
      )}

      <FilterControls
        searchQuery={searchQuery}
        setSearchQuery={(v) => {
          setSearchQuery(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        sortOrder={sortOrder}
        setSortOrder={(v) => {
          setSortOrder(v);
          setPage(1);
        }}
      />

      {usePagination && (
        <div className="w-full max-w-5xl mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-chocobo-light/85">
          <span>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredAndSortedCards.length)} of{' '}
            {filteredAndSortedCards.length.toLocaleString()} serials
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-chocobo-gold/60 text-chocobo-gold disabled:opacity-40 hover:bg-chocobo-gold/15"
            >
              &larr; Prev
            </button>
            <span className="tabular-nums">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border border-chocobo-gold/60 text-chocobo-gold disabled:opacity-40 hover:bg-chocobo-gold/15"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      <section className="w-full max-w-5xl mt-6" aria-label={`${activeSeries.name} Serialized Cards`}>
        {visibleCards.length === 0 ? (
          <div className="text-center py-12 bg-chocobo-dark/75 border border-chocobo-gold/40 rounded-lg text-chocobo-light">
            No cards match your current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleCards.map((card, index) => {
              const paddedId = card.id.toString().padStart(padWidth, '0');
              const cardPageHref = hasMultipleSeries
                ? `/t/${trackerSlug}/card/${paddedId}?series=${encodeURIComponent(activeSeries.slug)}`
                : `/t/${trackerSlug}/card/${paddedId}`;
              const slideIndex = cardIdToSlideIndex.get(card.id);
              const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
                resolveCardLinks(card);

              return (
                <article
                  key={`${activeSeries.slug}-${card.id}`}
                  className={`rounded-lg p-3.5 flex flex-col h-full transition-all ${
                    card.found
                      ? 'bg-chocobo-surface border border-chocobo-gold/45 hover:border-chocobo-gold hover:-translate-y-0.5'
                      : 'bg-chocobo-recessed/75 border border-chocobo-light/10 hover:border-chocobo-gold/30'
                  }`}
                >
                  {card.resolvedImage && slideIndex !== undefined ? (
                    <button
                      type="button"
                      className="relative aspect-[3/4] w-full mb-3 bg-black/30 rounded overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
                      onClick={() => {
                        setLightboxIndex(slideIndex);
                        setLightboxOpen(true);
                      }}
                      aria-label={`View larger image of ${activeSeries.name} #${paddedId}`}
                    >
                      <Image
                        src={card.resolvedImage}
                        alt={`${activeSeries.name} #${paddedId}`}
                        fill
                        quality={75}
                        priority={index < 2}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        sizes="(max-width: 640px) 85vw, (max-width: 768px) 44vw, (max-width: 1024px) 28vw, 220px"
                        className="object-contain"
                      />
                    </button>
                  ) : (
                    <div
                      className="aspect-[3/4] w-full mb-3 rounded border border-chocobo-gold/30 bg-gradient-to-b from-chocobo-gold/15 via-black/40 to-black/60 flex flex-col items-center justify-center p-4 text-center select-none"
                      aria-hidden="true"
                    >
                      <span className="text-3xl font-bold text-chocobo-gold/80 tabular-nums">
                        #{paddedId}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-chocobo-light/60 mt-2">
                        {card.found ? 'Photo Pending' : 'Undiscovered'}
                      </span>
                      <span className="text-[11px] text-chocobo-gold/60 mt-1">
                        of {activeSeries.serialMax}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-chocobo-gold tabular-nums">
                      <Link href={cardPageHref} className="hover:underline">
                        #{paddedId}
                      </Link>
                    </h3>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
                        card.found
                          ? 'bg-green-800/50 text-green-300'
                          : 'bg-gray-700/50 text-gray-300'
                      }`}
                    >
                      {card.found ? 'Found' : 'Not Found'}
                    </span>
                  </div>

                  <div className="flex-grow flex flex-col mt-2 space-y-2">
                    {typeof card.price === 'number' && (
                      <div className="text-sm text-green-400">
                        <p className="font-semibold tabular-nums">
                          Recent Sale: ${card.price.toLocaleString()}
                        </p>
                        {card.priceDate && (
                          <p className="text-xs text-chocobo-light/80">{card.priceDate}</p>
                        )}
                      </div>
                    )}

                    {card.grading && (
                      <div className="text-sm text-blue-400">
                        <p className="font-semibold">
                          {card.grading.service} {card.grading.grade}
                        </p>
                        {card.grading.dateGraded && (
                          <p className="text-xs text-chocobo-light/80">
                            {card.grading.dateGraded}
                          </p>
                        )}
                      </div>
                    )}

                    {card.found && (
                      <div className="text-sm text-chocobo-light space-y-0.5">
                        {card.foundBy && <p className="truncate">Found by: {card.foundBy}</p>}
                        {card.dateFound && (
                          <p className="text-xs text-chocobo-light/80">Date: {card.dateFound}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs">
                          {pullSourceUrl && (
                            <a
                              href={pullSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-chocobo-gold hover:underline"
                            >
                              Pull Source
                            </a>
                          )}
                          {marketplaceUrl && (
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
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCardForDetails(card)}
                        className="flex-1 bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-3 rounded text-xs sm:text-sm transition-colors"
                      >
                        Quick View
                      </button>
                      <Link
                        href={cardPageHref}
                        className="border border-chocobo-gold/70 hover:bg-chocobo-gold/15 text-chocobo-gold font-semibold py-2 px-3 rounded text-xs sm:text-sm transition-colors text-center"
                      >
                        Page
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {usePagination && totalPages > 1 && (
        <div className="w-full max-w-5xl mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded border border-chocobo-gold/60 text-chocobo-gold disabled:opacity-40 hover:bg-chocobo-gold/15"
          >
            &larr; Previous Page
          </button>
          <span className="text-chocobo-light tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded border border-chocobo-gold/60 text-chocobo-gold disabled:opacity-40 hover:bg-chocobo-gold/15"
          >
            Next Page &rarr;
          </button>
        </div>
      )}

      {lightboxOpen && lightboxSlides.length > 0 && (
        <CardLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          slides={lightboxSlides}
          index={lightboxIndex}
        />
      )}

      {selectedCardForDetails && (
        <CardDetails
          card={selectedCardForDetails}
          isOpen={Boolean(selectedCardForDetails)}
          onClose={() => setSelectedCardForDetails(null)}
        />
      )}
    </>
  );
}
