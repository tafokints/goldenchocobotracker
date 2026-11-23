'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import { formatCompactUsd } from '@/lib/format';
import {
  GOLDEN_CHOCOBO_ICONIC_NUMBERS,
  getIconicLabel,
  isIconicNumber,
} from '@/lib/iconic-numbers';
import type { ResolvedCard } from '@/lib/types';
import CompactMatrixView from './CompactMatrixView';
import FilterControls from './FilterControls';

const CardLightbox = dynamic(() => import('./CardLightbox'), { ssr: false });
const CardDetails = dynamic(() => import('./CardDetails'), { ssr: false });

type QuickFilter = 'all' | 'graded' | 'priced' | 'iconic' | 'unpulled-iconic';
type ViewMode = 'grid' | 'matrix';

interface TrackerGridProps {
  initialCards: ResolvedCard[];
}

export default function TrackerGrid({ initialCards }: TrackerGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('id-asc');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<ResolvedCard | null>(null);

  const filteredAndSortedCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...initialCards]
      .filter((card) => {
        const paddedId = card.id.toString().padStart(2, '0');
        const iconicLabel = getIconicLabel(card.id, GOLDEN_CHOCOBO_ICONIC_NUMBERS)?.toLowerCase();
        const matchesSearch =
          !query ||
          paddedId.includes(query) ||
          card.id.toString().includes(query) ||
          (card.foundBy?.toLowerCase().includes(query) ?? false) ||
          (card.region?.toLowerCase().includes(query) ?? false) ||
          (iconicLabel?.includes(query) ?? false);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'found' && card.found) ||
          (statusFilter === 'not-found' && !card.found);

        const matchesQuick =
          quickFilter === 'all' ||
          (quickFilter === 'graded' && Boolean(card.grading)) ||
          (quickFilter === 'priced' && typeof card.price === 'number') ||
          (quickFilter === 'iconic' && isIconicNumber(card.id)) ||
          (quickFilter === 'unpulled-iconic' && isIconicNumber(card.id) && !card.found);

        return matchesSearch && matchesStatus && matchesQuick;
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
  }, [initialCards, searchQuery, statusFilter, sortOrder, quickFilter]);

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

  const imagePriorityRank = useMemo(() => {
    const rankMap = new Map<number, number>();
    let rank = 0;
    for (const card of filteredAndSortedCards) {
      if (card.resolvedImage) {
        rankMap.set(card.id, rank++);
      }
    }
    return rankMap;
  }, [filteredAndSortedCards]);

  return (
    <>
      {/* Unified Dark Toolbar */}
      <div className="w-full bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-3 space-y-3">
        <FilterControls
          embedded
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <div className="pt-2.5 border-t border-chocobo-gold/15 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick filters">
            {(
              [
                ['all', 'All'],
                ['graded', 'Graded'],
                ['priced', 'Has Sale'],
                ['iconic', '★ Grails'],
                ['unpulled-iconic', '★ Unpulled Grails'],
              ] as Array<[QuickFilter, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setQuickFilter(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  quickFilter === key
                    ? 'bg-chocobo-gold text-chocobo-dark border-chocobo-gold font-semibold'
                    : 'bg-chocobo-recessed/70 text-chocobo-muted border-chocobo-gold/20 hover:border-chocobo-gold/50 hover:text-chocobo-light'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-chocobo-muted tabular-nums hidden sm:inline">
              {filteredAndSortedCards.length} of {initialCards.length}
            </span>
            <div
              className="inline-flex rounded-md border border-chocobo-gold/35 overflow-hidden text-xs font-medium bg-chocobo-recessed"
              role="group"
              aria-label="Layout view"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`px-3 py-1 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-chocobo-gold text-chocobo-dark font-semibold'
                    : 'text-chocobo-muted hover:text-chocobo-light'
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                aria-pressed={viewMode === 'matrix'}
                className={`px-3 py-1 transition-colors ${
                  viewMode === 'matrix'
                    ? 'bg-chocobo-gold text-chocobo-dark font-semibold'
                    : 'text-chocobo-muted hover:text-chocobo-light'
                }`}
              >
                1–77 Wall
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full" aria-label="Golden Chocobo Cards">
        <h2 className="sr-only">Golden Chocobo Card Collection</h2>
        {filteredAndSortedCards.length === 0 ? (
          <div className="text-center py-12 bg-chocobo-surface border border-chocobo-gold/20 rounded-lg text-chocobo-muted text-sm">
            No cards match your current filters.
          </div>
        ) : viewMode === 'matrix' ? (
          <CompactMatrixView
            cards={filteredAndSortedCards}
            onSelectCard={setSelectedCardForDetails}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedCards.map((card) => {
              const paddedId = card.id.toString().padStart(2, '0');
              const slideIndex = cardIdToSlideIndex.get(card.id);
              const imgRank = imagePriorityRank.get(card.id) ?? 99;
              const iconicLabel = getIconicLabel(card.id);
              const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
                resolveCardLinks(card);

              return (
                <article
                  key={card.id}
                  className={`rounded-lg p-3.5 flex flex-col h-full transition-all ${
                    card.found
                      ? 'bg-chocobo-surface border border-chocobo-gold/45 hover:border-chocobo-gold hover:-translate-y-0.5'
                      : 'bg-chocobo-recessed/75 border border-chocobo-light/10 hover:border-chocobo-gold/30'
                  }`}
                >
                  {card.resolvedImage && slideIndex !== undefined ? (
                    <button
                      type="button"
                      className="relative aspect-[3/4] w-full mb-3 bg-black/35 rounded-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
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
                        quality={75}
                        priority={imgRank < 2}
                        loading={imgRank < 4 ? 'eager' : 'lazy'}
                        sizes="(max-width: 640px) 85vw, (max-width: 768px) 44vw, (max-width: 1024px) 28vw, 220px"
                        className="object-contain"
                      />
                    </button>
                  ) : (
                    <div
                      className={`aspect-[3/4] w-full mb-3 rounded-md border flex flex-col items-center justify-center p-4 text-center select-none ${
                        card.found
                          ? 'border-chocobo-gold/25 bg-chocobo-recessed/80'
                          : 'border-chocobo-light/10 bg-chocobo-dark/80'
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`font-display text-3xl font-bold tabular-nums ${
                          card.found ? 'text-chocobo-gold/80' : 'text-chocobo-muted/45'
                        }`}
                      >
                        #{paddedId}
                      </span>
                      <span className="text-[11px] uppercase tracking-widest text-chocobo-muted/60 mt-1.5">
                        {card.found ? 'Photo Pending' : 'Unpulled'}
                      </span>
                      <span className="text-[11px] text-chocobo-muted/40 mt-0.5">of 77</span>
                    </div>
                  )}

                  {/* Card Header Row */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-chocobo-gold tabular-nums">
                      <Link href={`/card/${paddedId}`} className="hover:text-chocobo-gold-bright transition-colors">
                        #{paddedId}
                      </Link>
                    </h3>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                        card.found
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-chocobo-muted border border-white/10'
                      }`}
                    >
                      {card.found ? 'Found' : 'Unpulled'}
                    </span>
                  </div>

                  {iconicLabel && (
                    <span className="inline-block self-start mt-1.5 rounded px-2 py-0.5 text-[11px] font-medium bg-amber-950/70 border border-chocobo-gold/40 text-amber-200">
                      ★ {iconicLabel}
                    </span>
                  )}

                  {/* Card Metadata */}
                  <div className="flex-1 flex flex-col mt-2.5 text-xs">
                    <div className="space-y-1.5 pb-3">
                      {typeof card.price === 'number' && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                            {formatCompactUsd(card.price)}
                            <span className="text-xs font-normal text-chocobo-muted ml-1">
                              (${card.price.toLocaleString()})
                            </span>
                          </span>
                        </div>
                      )}

                      {card.grading && (
                        <p className="text-sky-300 font-medium">
                          {card.grading.service} {card.grading.grade}
                          {card.grading.dateGraded && (
                            <span className="text-chocobo-muted font-normal ml-1.5 tabular-nums">
                              &middot; {card.grading.dateGraded}
                            </span>
                          )}
                        </p>
                      )}

                      {card.found && (
                        <div className="text-chocobo-light/90 space-y-0.5 pt-0.5">
                          {card.foundBy && (
                            <p className="truncate">
                              <span className="text-chocobo-muted">By:</span> {card.foundBy}
                            </p>
                          )}
                          {card.dateFound && (
                            <p className="text-chocobo-muted tabular-nums">
                              {card.dateFound}
                              {card.region ? ` · ${card.region}` : ''}
                            </p>
                          )}
                          {(pullSourceUrl || marketplaceUrl) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                              {pullSourceUrl && (
                                <a
                                  href={pullSourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-chocobo-gold hover:underline"
                                >
                                  Source
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
                                  {marketplaceLabel}
                                  {isMarketplaceAffiliate ? ' (Paid Link)' : ''}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pinned Card Footer — Always Aligned on Baseline */}
                    <div className="mt-auto pt-2.5 border-t border-chocobo-gold/15 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCardForDetails(card)}
                        className="text-xs font-semibold text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
                      >
                        Quick View
                      </button>
                      <Link
                        href={`/card/${paddedId}`}
                        className="text-xs text-chocobo-muted hover:text-chocobo-light transition-colors"
                        aria-label={`Open full page for Golden Chocobo #${paddedId}`}
                      >
                        Details &rarr;
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
