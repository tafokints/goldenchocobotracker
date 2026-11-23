'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import { formatCompactUsd } from '@/lib/format';
import { formatGradingDisplay } from '@/lib/grading';
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

const VALID_STATUS_FILTERS = new Set(['all', 'found', 'not-found']);
const VALID_SORT_ORDERS = new Set([
  'id-asc',
  'id-desc',
  'price-desc',
  'price-asc',
  'date-desc',
  'date-asc',
]);
const VALID_QUICK_FILTERS = new Set<QuickFilter>([
  'all',
  'graded',
  'priced',
  'iconic',
  'unpulled-iconic',
]);
const VALID_VIEW_MODES = new Set<ViewMode>(['grid', 'matrix']);

interface TrackerGridProps {
  initialCards: ResolvedCard[];
}

export default function TrackerGrid({ initialCards }: TrackerGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('id-asc');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [hasReadUrl, setHasReadUrl] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<ResolvedCard | null>(null);

  // Read initial filter & view state from URL query params safely after hydration
  useEffect(() => {
    const applyParamsFromUrl = () => {
      const params = new URLSearchParams(window.location.search);

      setSearchQuery(params.get('q') ?? '');

      const status = params.get('status');
      setStatusFilter(status && VALID_STATUS_FILTERS.has(status) ? status : 'all');

      const sort = params.get('sort');
      setSortOrder(sort && VALID_SORT_ORDERS.has(sort) ? sort : 'id-asc');

      const quick = params.get('quick');
      setQuickFilter(
        quick && VALID_QUICK_FILTERS.has(quick as QuickFilter) ? (quick as QuickFilter) : 'all'
      );

      const view = params.get('view');
      setViewMode(view && VALID_VIEW_MODES.has(view as ViewMode) ? (view as ViewMode) : 'grid');
    };

    applyParamsFromUrl();
    setHasReadUrl(true);

    window.addEventListener('popstate', applyParamsFromUrl);
    return () => window.removeEventListener('popstate', applyParamsFromUrl);
  }, []);

  // Keep URL query params synced without triggering full navigation or losing unrelated params
  useEffect(() => {
    if (!hasReadUrl) return;

    const params = new URLSearchParams(window.location.search);
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    } else {
      params.delete('q');
    }

    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }

    if (sortOrder !== 'id-asc') {
      params.set('sort', sortOrder);
    } else {
      params.delete('sort');
    }

    if (quickFilter !== 'all') {
      params.set('quick', quickFilter);
    } else {
      params.delete('quick');
    }

    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    } else {
      params.delete('view');
    }

    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  }, [hasReadUrl, searchQuery, statusFilter, sortOrder, quickFilter, viewMode]);

  const quickFilterCounts = useMemo(() => {
    let graded = 0;
    let priced = 0;
    let iconic = 0;
    let unpulledIconic = 0;

    for (const card of initialCards) {
      if (card.grading) graded++;
      if (typeof card.price === 'number') priced++;
      if (isIconicNumber(card.id)) {
        iconic++;
        if (!card.found) unpulledIconic++;
      }
    }

    return {
      all: initialCards.length,
      graded,
      priced,
      iconic,
      'unpulled-iconic': unpulledIconic,
    };
  }, [initialCards]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'all' ||
    sortOrder !== 'id-asc' ||
    quickFilter !== 'all';

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOrder('id-asc');
    setQuickFilter('all');
  }, []);

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

  const selectedCardIndex = useMemo(() => {
    if (!selectedCardForDetails) return -1;
    return filteredAndSortedCards.findIndex((card) => card.id === selectedCardForDetails.id);
  }, [filteredAndSortedCards, selectedCardForDetails]);

  const handlePrevCard = useCallback(() => {
    if (selectedCardIndex > 0) {
      setSelectedCardForDetails(filteredAndSortedCards[selectedCardIndex - 1]);
    }
  }, [filteredAndSortedCards, selectedCardIndex]);

  const handleNextCard = useCallback(() => {
    if (selectedCardIndex >= 0 && selectedCardIndex < filteredAndSortedCards.length - 1) {
      setSelectedCardForDetails(filteredAndSortedCards[selectedCardIndex + 1]);
    }
  }, [filteredAndSortedCards, selectedCardIndex]);

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
      <div className="w-full bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-2.5 sm:p-3 space-y-2.5 sm:space-y-3">
        <FilterControls
          embedded
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <div className="pt-2 sm:pt-2.5 border-t border-chocobo-gold/15 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 sm:gap-2.5">
          <div
            className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar -mx-0.5 px-0.5"
            role="group"
            aria-label="Quick filters"
          >
            {(
              [
                ['all', 'All'],
                ['graded', 'Graded'],
                ['priced', 'Has Sale'],
                ['iconic', '★ Grails'],
                ['unpulled-iconic', '★ Unpulled Grails'],
              ] as Array<[QuickFilter, string]>
            ).map(([key, label]) => {
              const isSelected = quickFilter === key;
              const count = quickFilterCounts[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQuickFilter(key)}
                  aria-pressed={isSelected}
                  className={`shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-chocobo-gold text-chocobo-dark border-chocobo-gold font-semibold'
                      : 'bg-chocobo-recessed/70 text-chocobo-muted border-chocobo-gold/20 hover:border-chocobo-gold/50 hover:text-chocobo-light'
                  }`}
                >
                  {label}{' '}
                  <span
                    className={`tabular-nums ${
                      isSelected ? 'text-chocobo-dark/75' : 'text-chocobo-muted/75'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium text-chocobo-gold border border-chocobo-gold/35 bg-chocobo-recessed/70 hover:bg-chocobo-gold/15 hover:border-chocobo-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto sm:ml-auto">
            <span className="text-xs text-chocobo-muted tabular-nums">
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
                className={`min-h-[34px] sm:min-h-0 px-3 py-1.5 sm:py-1 transition-colors ${
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
                className={`min-h-[34px] sm:min-h-0 px-3 py-1.5 sm:py-1 transition-colors ${
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
          <div className="text-center py-12 px-4 bg-chocobo-surface border border-chocobo-gold/20 rounded-lg space-y-3">
            <p className="text-chocobo-muted text-sm">No cards match your current filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border border-chocobo-gold/60 text-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : viewMode === 'matrix' ? (
          <CompactMatrixView
            cards={filteredAndSortedCards}
            onSelectCard={setSelectedCardForDetails}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
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
                  className={`rounded-lg p-2.5 sm:p-3.5 flex flex-col h-full transition-all ${
                    card.found
                      ? 'bg-chocobo-surface border border-chocobo-gold/45 hover:border-chocobo-gold hover:-translate-y-0.5'
                      : 'bg-chocobo-recessed/75 border border-chocobo-light/10 hover:border-chocobo-gold/30'
                  }`}
                >
                  {card.resolvedImage && slideIndex !== undefined ? (
                    <button
                      type="button"
                      className="relative aspect-[3/4] w-full mb-2 sm:mb-3 bg-black/35 rounded-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
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
                        sizes="(max-width: 640px) 46vw, (max-width: 768px) 44vw, (max-width: 1024px) 28vw, 220px"
                        className="object-contain"
                      />
                    </button>
                  ) : (
                    <div
                      className={`aspect-[3/4] w-full mb-2 sm:mb-3 rounded-md border flex flex-col items-center justify-center p-2.5 sm:p-4 text-center select-none ${
                        card.found
                          ? 'border-chocobo-gold/25 bg-chocobo-recessed/80'
                          : 'border-chocobo-light/10 bg-chocobo-dark/80'
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${
                          card.found ? 'text-chocobo-gold/80' : 'text-chocobo-muted/45'
                        }`}
                      >
                        #{paddedId}
                      </span>
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-chocobo-muted/60 mt-1 sm:mt-1.5">
                        {card.found ? 'Photo Pending' : 'Unpulled'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-chocobo-muted/40 mt-0.5">of 77</span>
                    </div>
                  )}

                  {/* Card Header Row */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold text-chocobo-gold tabular-nums">
                      <Link href={`/card/${paddedId}`} className="hover:text-chocobo-gold-bright transition-colors">
                        #{paddedId}
                      </Link>
                    </h3>
                    <span
                      className={`inline-block rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
                        card.found
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-chocobo-muted border border-white/10'
                      }`}
                    >
                      {card.found ? 'Found' : 'Unpulled'}
                    </span>
                  </div>

                  {iconicLabel && (
                    <span className="inline-block self-start mt-1 sm:mt-1.5 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-amber-950/70 border border-chocobo-gold/40 text-amber-200 max-w-full truncate">
                      ★ {iconicLabel}
                    </span>
                  )}

                  {/* Card Metadata */}
                  <div className="flex-1 flex flex-col mt-2 sm:mt-2.5 text-[11px] sm:text-xs">
                    <div className="space-y-1 sm:space-y-1.5 pb-2.5 sm:pb-3">
                      {typeof card.price === 'number' && (
                        <div className="flex items-baseline justify-between gap-1.5">
                          <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                            {formatCompactUsd(card.price)}
                            <span className="hidden sm:inline text-xs font-normal text-chocobo-muted ml-1">
                              (${card.price.toLocaleString()})
                            </span>
                          </span>
                        </div>
                      )}

                      {card.grading && (
                        <p className="text-sky-300 font-medium leading-snug">
                          {formatGradingDisplay(card.grading)}
                          {card.grading.dateGraded && (
                            <span className="hidden sm:inline text-chocobo-muted font-normal ml-1.5 tabular-nums">
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
                            <p className="text-chocobo-muted tabular-nums truncate">
                              {card.dateFound}
                              {card.region ? ` · ${card.region}` : ''}
                            </p>
                          )}
                          {(pullSourceUrl || marketplaceUrl) && (
                            <div className="flex flex-wrap gap-x-2.5 sm:gap-x-3 gap-y-1 pt-0.5 sm:pt-1">
                              {pullSourceUrl && (
                                <a
                                  href={pullSourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-chocobo-gold hover:underline py-0.5"
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
                                  className="text-chocobo-gold hover:underline py-0.5"
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
                    <div className="mt-auto pt-2 sm:pt-2.5 border-t border-chocobo-gold/15 flex items-center justify-between gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCardForDetails(card)}
                        className="text-[11px] sm:text-xs font-semibold text-chocobo-gold hover:text-chocobo-gold-bright transition-colors py-1.5 sm:py-0.5 -my-1 sm:my-0"
                      >
                        Quick View
                      </button>
                      <Link
                        href={`/card/${paddedId}`}
                        className="text-[11px] sm:text-xs text-chocobo-muted hover:text-chocobo-light transition-colors py-1.5 sm:py-0.5 -my-1 sm:my-0"
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
          onPrev={selectedCardIndex > 0 ? handlePrevCard : undefined}
          onNext={
            selectedCardIndex >= 0 && selectedCardIndex < filteredAndSortedCards.length - 1
              ? handleNextCard
              : undefined
          }
          positionLabel={
            selectedCardIndex >= 0
              ? `${selectedCardIndex + 1} of ${filteredAndSortedCards.length}`
              : undefined
          }
        />
      )}
    </>
  );
}
