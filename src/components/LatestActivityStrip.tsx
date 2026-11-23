import Link from 'next/link';
import type { ActivityEvent } from '@/lib/activity';

interface LatestActivityStripProps {
  events: ActivityEvent[];
  cardHrefPrefix?: string;
}

const BADGE_STYLES = {
  pull: 'bg-green-900/60 text-green-300 border-green-500/40',
  sale: 'bg-yellow-900/60 text-yellow-200 border-chocobo-gold/50',
  grading: 'bg-blue-900/60 text-blue-300 border-blue-500/40',
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
  if (events.length === 0) return null;

  return (
    <section
      aria-label="Latest verified activity"
      className="w-full max-w-5xl mt-4 bg-chocobo-dark/75 border border-chocobo-gold/30 rounded-lg p-4"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-chocobo-gold">
          Latest Verified Activity
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/feed.xml" className="text-chocobo-light/70 hover:text-chocobo-gold">
            RSS Feed
          </Link>
          <Link href="/stats" className="text-chocobo-gold hover:underline">
            Full Stats &rarr;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`${cardHrefPrefix}/${ev.paddedId}`}
            className="flex items-center justify-between gap-2 bg-black/30 hover:bg-chocobo-gold/10 border border-chocobo-gold/20 hover:border-chocobo-gold/60 rounded px-3 py-2 text-xs transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${BADGE_STYLES[ev.type]}`}
              >
                {BADGE_LABELS[ev.type]}
              </span>
              <span className="text-chocobo-light truncate font-medium">{ev.title}</span>
            </div>
            <span className="text-[11px] text-chocobo-light/60 tabular-nums shrink-0">
              {ev.date}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
