'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { resolveCardLinks } from '@/lib/affiliate';
import { getGradingCertUrl } from '@/lib/grading-certs';
import { getIconicLabel } from '@/lib/iconic-numbers';
import { PULL_CHANNEL_LABELS, type ResolvedCard } from '@/lib/types';
import CopyLinkButton from './CopyLinkButton';

interface CardDetailsProps {
  card: ResolvedCard;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDetails({ card, isOpen, onClose }: CardDetailsProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const paddedId = card.id.toString().padStart(2, '0');
  const iconicLabel = getIconicLabel(card.id);
  const { pullSourceUrl, marketplaceUrl, marketplaceLabel, isMarketplaceAffiliate } =
    resolveCardLinks(card);
  const certLookupUrl = getGradingCertUrl(card.grading?.service, card.grading?.certNumber);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 w-[min(92vw,42rem)] max-h-[90vh] overflow-y-auto divide-y divide-chocobo-gold/20">
        <div className="flex justify-between items-start pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="card-details-title" className="text-xl font-bold text-chocobo-gold">
                Golden Chocobo #{paddedId} Details
              </h2>
              {iconicLabel && (
                <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-yellow-500/20 border border-yellow-400/50 text-yellow-200">
                  ★ {iconicLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
              <Link
                href={`/card/${paddedId}`}
                className="text-xs text-chocobo-light/80 hover:text-chocobo-gold underline"
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
                className="text-xs text-chocobo-light/80 hover:text-chocobo-gold underline"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close card details"
            className="text-chocobo-gold hover:text-yellow-400 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 pt-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-chocobo-gold mb-2">Basic Information</h3>
            <div className="bg-chocobo-light/10 p-4 rounded space-y-1.5">
              <p className="text-chocobo-light">
                <span className="font-bold">Status:</span> {card.found ? 'Found' : 'Not Found'}
              </p>
              {card.found && (
                <>
                  {card.foundBy && (
                    <p className="text-chocobo-light">
                      <span className="font-bold">Found by:</span> {card.foundBy}
                    </p>
                  )}
                  {card.dateFound && (
                    <p className="text-chocobo-light">
                      <span className="font-bold">Date found:</span> {card.dateFound}
                    </p>
                  )}
                  {card.pullChannel && (
                    <p className="text-chocobo-light">
                      <span className="font-bold">Pull Origin:</span>{' '}
                      {PULL_CHANNEL_LABELS[card.pullChannel]}
                    </p>
                  )}
                  {card.region && (
                    <p className="text-chocobo-light">
                      <span className="font-bold">Region:</span> {card.region}
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
              )}
            </div>
          </div>

          {/* Current Price */}
          {typeof card.price === 'number' && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Recent Reported Sale</h3>
              <div className="bg-chocobo-light/10 p-4 rounded">
                <p className="text-green-400 text-xl font-bold tabular-nums">
                  ${card.price.toLocaleString()}
                </p>
                {card.priceDate && (
                  <p className="text-chocobo-light/80 text-sm">Last updated: {card.priceDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Grading Information */}
          {card.grading && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Grading Information</h3>
              <div className="bg-chocobo-light/10 p-4 rounded space-y-1">
                <p className="text-blue-400 text-lg font-bold">
                  {card.grading.service} {card.grading.grade}
                </p>
                {card.grading.certNumber && (
                  <p className="text-chocobo-light text-sm">
                    Cert #:{' '}
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
                  <p className="text-chocobo-light/80 text-sm">
                    Graded on: {card.grading.dateGraded}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Price History */}
          {card.priceHistory && card.priceHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Price History</h3>
              <div className="bg-chocobo-light/10 p-4 rounded max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {card.priceHistory.map((entry, index) => (
                    <div
                      key={`${entry.date}-${entry.price}-${index}`}
                      className="border-b border-chocobo-gold/30 pb-2 last:border-b-0"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-green-400 font-bold tabular-nums">
                            ${entry.price.toLocaleString()}
                          </p>
                          <p className="text-chocobo-light/80 text-sm">{entry.date}</p>
                        </div>
                        <div className="text-right text-xs text-chocobo-light/80">
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
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Card Photo</h3>
              <div className="relative aspect-[3/4] max-w-sm mx-auto bg-black/30 rounded overflow-hidden">
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
