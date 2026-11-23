import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-20 flex items-center justify-center">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-lg bg-chocobo-surface border border-chocobo-gold/35 rounded-lg p-6 sm:p-8 text-center space-y-5"
      >
        <div className="mx-auto w-24 h-32 rounded-md border border-chocobo-gold/25 bg-chocobo-recessed flex flex-col items-center justify-center select-none">
          <span className="font-display text-3xl font-bold text-chocobo-gold/80 tabular-nums">
            #??
          </span>
          <span className="text-[10px] uppercase tracking-widest text-chocobo-muted mt-1">
            of 77
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold text-chocobo-gold">
            404 &middot; Entry Not Found
          </p>
          <h1
            id="not-found-title"
            className="font-display text-2xl sm:text-3xl font-bold text-chocobo-light"
          >
            Serial Not In The Ledger
          </h1>
          <p className="text-sm text-chocobo-muted leading-relaxed">
            This page or serial number doesn&rsquo;t exist. Serialized Golden Chocobo cards are
            numbered <span className="text-chocobo-light tabular-nums">#01</span> through{' '}
            <span className="text-chocobo-light tabular-nums">#77</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-1">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-md bg-chocobo-gold hover:bg-chocobo-gold-bright text-chocobo-dark text-sm font-semibold transition-colors"
          >
            Browse All 77 Cards
          </Link>
          <Link
            href="/?view=matrix"
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-md border border-chocobo-gold/45 hover:border-chocobo-gold hover:bg-chocobo-gold/10 text-chocobo-gold text-sm font-semibold transition-colors"
          >
            Open 1–77 Wall
          </Link>
          <Link
            href="/stats"
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-md border border-chocobo-light/15 hover:border-chocobo-gold/50 text-chocobo-light text-sm font-medium transition-colors"
          >
            Market Stats
          </Link>
        </div>
      </section>
    </main>
  );
}
