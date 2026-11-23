'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import { formatGradingDisplay } from '@/lib/grading';
import { getGradingCertUrl } from '@/lib/grading-certs';
import { getIconicLabel } from '@/lib/iconic-numbers';
import { PULL_CHANNEL_LABELS, type ResolvedCard } from '@/lib/types';
import CopyLinkButton from './CopyLinkButton';

interface CardDetailsProps {
  card: ResolvedCard;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  positionLabel?: string;
}

export default function CardDetails({
  card,
  isOpen,
  onClose,
  onPrev,
  onNext,
  positionLabel,
}: CardDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'ArrowLeft' && onPrev) {
        event.preventDefault();
        onPrev();
      } else if (event.key === 'ArrowRight' && onNext) {
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [isOpen, card.id]);

  if (!isOpen) return null;

  const paddedId = card.id.toString().padStart(2, '0');
  const iconicLabel = getIconicLabel(card.id);
  const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
    resolveCardLinks(card);
  const certLookupUrl = getGradingCertUrl(card.grading?.service, card.grading?.certNumber);
  const showStepper = Boolean(onPrev || onNext || positionLabel);

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-chocobo-surface border border-chocobo-gold/55 rounded-lg p-5 sm:p-6 w-[min(92vw,42rem)] max-h-[90vh] overflow-y-auto divide-y divide-chocobo-gold/15 shadow-2xl"
      >
        <div className="pb-4 space-y-3">
          {showStepper && (
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-chocobo-gold/15">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!onPrev}
                  aria-label="Previous card"
                  title="Previous card (←)"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-chocobo-gold/30 bg-chocobo-recessed text-chocobo-light hover:border-chocobo-gold hover:text-chocobo-gold disabled:opacity-35 disabled:hover:border-chocobo-gold/30 disabled:hover:text-chocobo-light disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
                >
                  <span aria-hidden="true">&larr;</span>
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!onNext}
                  aria-label="Next card"
                  title="Next card (→)"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-chocobo-gold/30 bg-chocobo-recessed text-chocobo-light hover:border-chocobo-gold hover:text-chocobo-gold disabled:opacity-35 disabled:hover:border-chocobo-gold/30 disabled:hover:text-chocobo-light disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
                >
                  <span>Next</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
                {positionLabel && (
                  <span className="ml-1.5 text-xs text-chocobo-muted tabular-nums">
                    {positionLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline text-[11px] text-chocobo-muted/70 select-none">
                  &larr; &rarr; step &middot; Esc close
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close card details"
                  className="text-chocobo-muted hover:text-chocobo-gold rounded-md px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="card-details-title"
                  className="font-display text-xl font-bold text-chocobo-gold tabular-nums"
                >
                  Golden Chocobo #{paddedId}
                </h2>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                    card.found
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-chocobo-muted border border-white/10'
                  }`}
                >
                  {card.found ? 'Found' : 'Unpulled'}
                </span>
                {iconicLabel && (
                  <span className="rounded px-2 py-0.5 text-[11px] font-medium bg-amber-950/80 border border-chocobo-gold/45 text-amber-200">
                    ★ {iconicLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                <Link
                  href={`/card/${paddedId}`}
                  className="text-xs text-chocobo-light/85 hover:text-chocobo-gold underline transition-colors"
                >
                  Open shareable card page &rarr;
                </Link>
                <Link
                  href={`/submit?card=${paddedId}`}
                  className="text-xs text-chocobo-gold hover:underline font-semibold"
                >
                  Suggest Update
                </Link>
                <CopyLinkButton
                  path={`/card/${paddedId}`}
                  label="Copy Share Link"
                  className="text-xs text-chocobo-light/85 hover:text-chocobo-gold underline transition-colors"
                />
              </div>
            </div>
            {!showStepper && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close card details"
                className="text-chocobo-muted hover:text-chocobo-gold rounded-md px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5 pt-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-chocobo-gold mb-2">
              Basic Information
            </h3>
            <div className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md space-y-1.5 text-sm">
              <p className="text-chocobo-light">
                <span className="text-chocobo-muted font-medium">Status:</span>{' '}
                {card.found ? 'Found' : 'Unpulled'}
              </p>
              {card.found && (
                <>
                  {card.foundBy && (
                    <p className="text-chocobo-light">
                      <span className="text-chocobo-muted font-medium">Found by:</span>{' '}
                      {card.foundBy}
                    </p>
                  )}
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
                      <span className="text-chocobo-muted font-medium">Region:</span> {card.region}
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
                      <span className="text-chocobo-muted font-medium">Marketplace:</span>{' '}
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
              )}
            </div>
          </div>

          {/* Current Price */}
          {typeof card.price === 'number' && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-chocobo-gold mb-2">
                Recent Reported Sale
              </h3>
              <div className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md">
                <p className="text-emerald-400 text-xl font-bold tabular-nums">
                  ${card.price.toLocaleString()}
                </p>
                {card.priceDate && (
                  <p className="text-chocobo-muted text-xs mt-0.5 tabular-nums">
                    Last updated: {card.priceDate}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Grading Information */}
          {card.grading && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-chocobo-gold mb-2">
                Grading Information
              </h3>
              <div className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md space-y-1">
                <p className="text-sky-300 text-lg font-bold tabular-nums">
                  {formatGradingDisplay(card.grading)}
                </p>
                {card.grading.certNumber && (
                  <p className="text-chocobo-light text-sm tabular-nums">
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
                  <p className="text-chocobo-muted text-xs tabular-nums">
                    Graded on: {card.grading.dateGraded}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Price History */}
          {card.priceHistory && card.priceHistory.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-chocobo-gold mb-2">
                Price History
              </h3>
              <div className="bg-chocobo-recessed/80 border border-chocobo-gold/15 p-4 rounded-md max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {card.priceHistory.map((entry, index) => (
                    <div
                      key={`${entry.date}-${entry.price}-${index}`}
                      className="border-b border-chocobo-gold/20 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-emerald-400 font-bold tabular-nums">
                            ${entry.price.toLocaleString()}
                          </p>
                          <p className="text-chocobo-muted text-xs tabular-nums">{entry.date}</p>
                        </div>
                        <div className="text-right text-xs text-chocobo-muted">
                          {entry.soldBy && <p>From: {entry.soldBy}</p>}
                          {entry.soldTo && <p>To: {entry.soldTo}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {card.resolvedImage && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-chocobo-gold mb-2">
                Card Photo
              </h3>
              <div className="relative aspect-[3/4] max-w-sm mx-auto bg-black/35 border border-chocobo-gold/20 rounded-md overflow-hidden">
                <Image
                  src={card.resolvedImage}
                  alt={`Golden Chocobo Card #${paddedId}`}
                  fill
                  quality={80}
                  sizes="(max-width: 640px) 90vw, 384px"
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
