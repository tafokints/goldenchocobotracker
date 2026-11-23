'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ActivityEvent } from '@/lib/activity';

interface LatestActivityStripProps {
  events: ActivityEvent[];
  cardHrefPrefix?: string;
}

const BADGE_STYLES = {
  pull: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/35',
  sale: 'bg-amber-950/80 text-amber-200 border-chocobo-gold/45',
  grading: 'bg-sky-950/80 text-sky-300 border-sky-500/35',
};

const BADGE_LABELS = {
  pull: 'PULL',
  sale: 'SALE',
  grading: 'GRADE',
};

export default function LatestActivityStrip({
  events,
  cardHrefPrefix = '/card',
}: LatestActivityStripProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const latest = events[0];

  return (
    <section
      aria-label="Latest verified activity"
      className="w-full bg-chocobo-surface/80 border border-chocobo-gold/20 rounded-lg px-3 sm:px-3.5 py-2 sm:py-2.5"
    >
      <div className="flex flex-nowrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-chocobo-muted shrink-0">
            Latest
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${BADGE_STYLES[latest.type]}`}
          >
            {BADGE_LABELS[latest.type]}
          </span>
          <Link
            href={`${cardHrefPrefix}/${latest.paddedId}`}
            className="text-chocobo-light hover:text-chocobo-gold font-medium truncate transition-colors py-1 -my-1"
          >
            {latest.title}
          </Link>
          <span className="text-chocobo-muted/80 tabular-nums shrink-0 hidden sm:inline">
            {latest.date}
          </span>
        </div>

        {events.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="text-xs font-medium text-chocobo-gold hover:text-chocobo-gold-bright transition-colors shrink-0 py-1.5 px-1 -my-1.5 whitespace-nowrap"
          >
            {expanded ? 'Hide ▲' : `Recent (${events.length}) ▾`}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-chocobo-gold/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`${cardHrefPrefix}/${ev.paddedId}`}
              className="flex items-center justify-between gap-2 bg-chocobo-recessed/70 hover:bg-chocobo-gold/10 border border-chocobo-gold/15 hover:border-chocobo-gold/45 rounded px-3 py-2 text-xs transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${BADGE_STYLES[ev.type]}`}
                >
                  {BADGE_LABELS[ev.type]}
                </span>
                <span className="text-chocobo-light truncate font-medium">{ev.title}</span>
              </div>
              <span className="text-[11px] text-chocobo-muted tabular-nums shrink-0">
                {ev.date}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
