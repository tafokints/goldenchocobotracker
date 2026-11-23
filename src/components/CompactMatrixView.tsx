'use client';

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-chocobo-light/80 bg-chocobo-dark/75 border border-chocobo-gold/30 rounded-lg px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-chocobo-gold inline-block" /> Found
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-chocobo-dark border border-chocobo-gold/35 inline-block" />{' '}
            Unpulled
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-yellow-300 font-bold">★</span> Iconic / Grail Number
          </span>
        </div>
        <span className="text-chocobo-light/65">Click any tile for full details</span>
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
              title={`${card.name} — ${card.found ? `Found${card.foundBy ? ` by ${card.foundBy}` : ''}` : 'Not Found'}${
                iconic ? ` · ${iconic}` : ''
              }${hasPrice ? ` · $${card.price!.toLocaleString()}` : ''}`}
              className={`relative aspect-square rounded-md border p-1.5 flex flex-col items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold ${
                card.found
                  ? 'bg-chocobo-gold/25 border-chocobo-gold text-chocobo-gold shadow-[0_0_8px_rgba(214,167,61,0.3)]'
                  : iconic
                    ? 'bg-chocobo-dark/90 border-yellow-400/60 text-chocobo-light/75'
                    : 'bg-chocobo-dark/70 border-chocobo-gold/20 text-chocobo-light/45'
              }`}
            >
              {iconic && (
                <span
                  aria-label={iconic}
                  className="absolute top-0.5 right-1 text-[10px] leading-none text-yellow-300"
                >
                  ★
                </span>
              )}
              <span className="text-sm sm:text-base font-bold tabular-nums">#{padded}</span>
              {hasPrice ? (
                <span className="text-[9px] text-green-300 font-semibold tabular-nums leading-tight mt-0.5">
                  ${Math.round(card.price! / 1000)}k
                </span>
              ) : card.grading ? (
                <span className="text-[9px] text-blue-300 font-semibold leading-tight mt-0.5">
                  {card.grading.service} {card.grading.grade}
                </span>
              ) : (
                <span className="text-[9px] opacity-70 leading-tight mt-0.5">
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
