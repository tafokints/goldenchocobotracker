'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import type { ResolvedCard } from '@/lib/types';
import FilterControls from './FilterControls';

const CardLightbox = dynamic(() => import('./CardLightbox'), { ssr: false });
const CardDetails = dynamic(() => import('./CardDetails'), { ssr: false });

interface TrackerGridProps {
  initialCards: ResolvedCard[];
}

export default function TrackerGrid({ initialCards }: TrackerGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('id-asc');

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<ResolvedCard | null>(null);

  const filteredAndSortedCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...initialCards]
      .filter((card) => {
        const paddedId = card.id.toString().padStart(2, '0');
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
  }, [initialCards, searchQuery, statusFilter, sortOrder]);

  const { lightboxSlides, cardIdToSlideIndex } = useMemo(() => {
    const slides: Array<{ src: string; alt: string }> = [];
    const indexMap = new Map<number, number>();

    for (const card of filteredAndSortedCards) {
      if (card.resolvedImage) {
        indexMap.set(card.id, slides.length);
        slides.push({
          src: card.resolvedImage,
          alt: `Golden Chocobo Card #${card.id.toString().padStart(2, '0')}`,
        });
      }
    }

    return { lightboxSlides: slides, cardIdToSlideIndex: indexMap };
  }, [filteredAndSortedCards]);

  return (
    <>
      <FilterControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <section className="w-full max-w-5xl mt-8" aria-label="Golden Chocobo Cards">
        <h2 className="sr-only">Golden Chocobo Card Collection</h2>
        {filteredAndSortedCards.length === 0 ? (
          <div className="text-center py-12 bg-chocobo-dark/75 border border-chocobo-gold/40 rounded-lg text-chocobo-light">
            No cards match your current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedCards.map((card, index) => {
              const paddedId = card.id.toString().padStart(2, '0');
              const slideIndex = cardIdToSlideIndex.get(card.id);
              const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
                resolveCardLinks(card);

              return (
                <article
                  key={card.id}
                  className="border border-chocobo-gold rounded-lg p-4 bg-chocobo-dark shadow-[0_0_15px_rgba(214,167,61,0.35)] flex flex-col h-full"
                >
                  {card.resolvedImage && slideIndex !== undefined ? (
                    <button
                      type="button"
                      className="relative aspect-[3/4] w-full mb-3 bg-black/30 rounded overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
                      onClick={() => {
                        setLightboxIndex(slideIndex);
                        setLightboxOpen(true);
                      }}
                      aria-label={`View larger image of Golden Chocobo Card #${paddedId}`}
                    >
                      <Image
                        src={card.resolvedImage}
                        alt={`Golden Chocobo Card #${paddedId} - ${card.name}`}
                        fill
                        priority={index < 4}
                        sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, (max-width: 1024px) 30vw, 230px"
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
                      <span className="text-[11px] text-chocobo-gold/60 mt-1">of 77</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-chocobo-gold tabular-nums">
                      <Link href={`/card/${paddedId}`} className="hover:underline">
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
                        {card.dateFound && <p className="text-xs text-chocobo-light/80">Date: {card.dateFound}</p>}
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
                        href={`/card/${paddedId}`}
                        className="border border-chocobo-gold/70 hover:bg-chocobo-gold/15 text-chocobo-gold font-semibold py-2 px-3 rounded text-xs sm:text-sm transition-colors text-center"
                        aria-label={`Open full page for Golden Chocobo #${paddedId}`}
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
