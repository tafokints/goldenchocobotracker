'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import { formatCompactUsd } from '@/lib/format';
import type { SeriesWithCards } from '@/lib/multi-tracker';
import type { ResolvedCard } from '@/lib/types';
import FilterControls from './FilterControls';

const CardLightbox = dynamic(() => import('./CardLightbox'), { ssr: false });
const CardDetails = dynamic(() => import('./CardDetails'), { ssr: false });

const PAGE_SIZE = 48;

type QuickFilter = 'all' | 'graded' | 'priced';
type GradingWithOptionalLabel = NonNullable<ResolvedCard['grading']> & { gradeLabel?: string };

function formatCardGrading(grading: GradingWithOptionalLabel): string {
  const cleanLabel = grading.gradeLabel?.trim();
  if (!cleanLabel) return `${grading.service} ${grading.grade}`;
  return cleanLabel.includes(String(grading.grade))
    ? `${grading.service} ${cleanLabel}`
    : `${grading.service} ${grading.grade} · ${cleanLabel}`;
}

interface MultiTrackerGridProps {
  trackerSlug: string;
  seriesList: SeriesWithCards[];
}

export default function MultiTrackerGrid({ trackerSlug, seriesList }: MultiTrackerGridProps) {
  const [activeSeriesSlug, setActiveSeriesSlug] = useState(seriesList[0]?.slug || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('id-asc');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
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
          (card.foundBy?.toLowerCase().includes(query) ?? false) ||
          (card.region?.toLowerCase().includes(query) ?? false);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'found' && card.found) ||
          (statusFilter === 'not-found' && !card.found);

        const matchesQuick =
          quickFilter === 'all' ||
          (quickFilter === 'graded' && Boolean(card.grading)) ||
          (quickFilter === 'priced' && typeof card.price === 'number');

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
  }, [activeSeries, padWidth, searchQuery, statusFilter, sortOrder, quickFilter]);

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

  const imagePriorityRank = useMemo(() => {
    const rankMap = new Map<number, number>();
    let rank = 0;
    for (const card of visibleCards) {
      if (card.resolvedImage) {
        rankMap.set(card.id, rank++);
      }
    }
    return rankMap;
  }, [visibleCards]);

  if (!activeSeries) {
    return null;
  }

  return (
    <>
      {hasMultipleSeries && (
        <div
          role="tablist"
          aria-label="Card Series"
          className="w-full flex flex-wrap items-center gap-2"
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
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border ${
                  isSelected
                    ? 'bg-chocobo-gold text-chocobo-dark border-chocobo-gold font-semibold'
                    : 'bg-chocobo-surface text-chocobo-muted border-chocobo-gold/25 hover:border-chocobo-gold/60 hover:text-chocobo-light'
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

      {/* Unified Dark Toolbar */}
      <div className="w-full bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-3 space-y-3">
        <FilterControls
          embedded
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

        <div className="pt-2.5 border-t border-chocobo-gold/15 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick filters">
            {(
              [
                ['all', 'All'],
                ['graded', 'Graded'],
                ['priced', 'Has Sale'],
              ] as Array<[QuickFilter, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setQuickFilter(key);
                  setPage(1);
                }}
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

          <span className="text-xs text-chocobo-muted tabular-nums ml-auto">
            {filteredAndSortedCards.length.toLocaleString()} of{' '}
            {activeSeries.cards.length.toLocaleString()}
          </span>
        </div>
      </div>

      {usePagination && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-chocobo-muted">
          <span className="tabular-nums">
            Showing {(safePage - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(safePage * PAGE_SIZE, filteredAndSortedCards.length)} of{' '}
            {filteredAndSortedCards.length.toLocaleString()} serials
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-chocobo-gold/45 text-chocobo-gold disabled:opacity-40 hover:border-chocobo-gold hover:bg-chocobo-gold/10 transition-colors"
            >
              &larr; Prev
            </button>
            <span className="tabular-nums text-chocobo-light">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border border-chocobo-gold/45 text-chocobo-gold disabled:opacity-40 hover:border-chocobo-gold hover:bg-chocobo-gold/10 transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      <section className="w-full" aria-label={`${activeSeries.name} Serialized Cards`}>
        <h2 className="sr-only">{activeSeries.name} Serialized Cards</h2>
        {visibleCards.length === 0 ? (
          <div className="text-center py-12 bg-chocobo-surface border border-chocobo-gold/20 rounded-lg text-chocobo-muted text-sm">
            No cards match your current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleCards.map((card) => {
              const paddedId = card.id.toString().padStart(padWidth, '0');
              const cardPageHref = hasMultipleSeries
                ? `/t/${trackerSlug}/card/${paddedId}?series=${encodeURIComponent(activeSeries.slug)}`
                : `/t/${trackerSlug}/card/${paddedId}`;
              const slideIndex = cardIdToSlideIndex.get(card.id);
              const imgRank = imagePriorityRank.get(card.id) ?? 99;
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
                      className="relative aspect-[3/4] w-full mb-3 bg-black/35 rounded-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
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
                      <span className="text-[11px] text-chocobo-muted/40 mt-0.5 tabular-nums">
                        of {activeSeries.serialMax}
                      </span>
                    </div>
                  )}

                  {/* Card Header Row */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-chocobo-gold tabular-nums">
                      <Link
                        href={cardPageHref}
                        className="hover:text-chocobo-gold-bright transition-colors"
                      >
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
                          {formatCardGrading(card.grading as GradingWithOptionalLabel)}
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
                        href={cardPageHref}
                        className="text-xs text-chocobo-muted hover:text-chocobo-light transition-colors"
                        aria-label={`Open full page for ${activeSeries.name} #${paddedId}`}
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

      {usePagination && totalPages > 1 && (
        <div className="w-full pt-2 flex items-center justify-center gap-3 text-xs sm:text-sm">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded border border-chocobo-gold/45 text-chocobo-gold disabled:opacity-40 hover:border-chocobo-gold hover:bg-chocobo-gold/10 transition-colors"
          >
            &larr; Previous Page
          </button>
          <span className="text-chocobo-muted tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded border border-chocobo-gold/45 text-chocobo-gold disabled:opacity-40 hover:border-chocobo-gold hover:bg-chocobo-gold/10 transition-colors"
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
