'use client';

import { formatCompactUsd } from '@/lib/format';
import { formatGradingDisplay } from '@/lib/grading';
import { GOLDEN_CHOCOBO_ICONIC_NUMBERS, getIconicLabel } from '@/lib/iconic-numbers';
import type { ResolvedCard } from '@/lib/types';

interface CompactMatrixViewProps {
  cards: ResolvedCard[];
  iconicMap?: Record<number, string>;
  padWidth?: number;
  onSelectCard: (card: ResolvedCard) => void;
}

export default function CompactMatrixView({
  cards,
  iconicMap = GOLDEN_CHOCOBO_ICONIC_NUMBERS,
  padWidth = 2,
  onSelectCard,
}: CompactMatrixViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-chocobo-muted bg-chocobo-surface border border-chocobo-gold/20 rounded-lg px-4 py-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-chocobo-light">
            <span className="w-2.5 h-2.5 rounded-sm bg-chocobo-gold inline-block" /> Found
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-chocobo-recessed border border-chocobo-light/20 inline-block" />{' '}
            Unpulled
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-200">
            <span className="text-amber-300">★</span> Iconic / Grail
          </span>
        </div>
        <span>Click any tile for full details</span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-11 gap-2">
        {cards.map((card) => {
          const padded = card.id.toString().padStart(padWidth, '0');
          const iconic = getIconicLabel(card.id, iconicMap);
          const hasPrice = typeof card.price === 'number';

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCard(card)}
              title={`${card.name} — ${card.found ? `Found${card.foundBy ? ` by ${card.foundBy}` : ''}` : 'Unpulled'}${
                iconic ? ` · ${iconic}` : ''
              }${card.grading ? ` · ${formatGradingDisplay(card.grading)}` : ''}${
                hasPrice ? ` · $${card.price!.toLocaleString()}` : ''
              }`}
              className={`relative aspect-square rounded-md border p-1.5 flex flex-col items-center justify-center transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold ${
                card.found
                  ? 'bg-chocobo-gold/20 border-chocobo-gold/75 text-chocobo-gold hover:bg-chocobo-gold/30'
                  : iconic
                    ? 'bg-chocobo-surface/80 border-chocobo-gold/45 text-chocobo-light/70 hover:border-chocobo-gold'
                    : 'bg-chocobo-recessed/80 border-chocobo-light/10 text-chocobo-muted/55 hover:border-chocobo-gold/35'
              }`}
            >
              {iconic && (
                <span
                  aria-label={iconic}
                  className="absolute top-0.5 right-1 text-[10px] leading-none text-amber-300"
                >
                  ★
                </span>
              )}
              <span className="font-display text-sm sm:text-base font-bold tabular-nums leading-none">
                #{padded}
              </span>
              {hasPrice ? (
                <span className="text-[10px] text-emerald-300 font-semibold tabular-nums leading-tight mt-1">
                  {formatCompactUsd(card.price!)}
                </span>
              ) : card.grading ? (
                <span className="text-[10px] text-sky-300 font-medium leading-tight mt-1">
                  {card.grading.service} {card.grading.grade}
                </span>
              ) : (
                <span className="text-[10px] opacity-75 leading-tight mt-1">
                  {card.found ? 'Found' : '—'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
