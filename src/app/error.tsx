'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[AppErrorBoundary]', {
      message: error.message,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-20 flex items-center justify-center">
      <section
        role="alert"
        aria-labelledby="app-error-title"
        className="w-full max-w-lg bg-chocobo-surface border border-chocobo-gold/35 rounded-lg p-6 sm:p-8 text-center space-y-5"
      >
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold text-amber-300">
            Temporary Ledger Interruption
          </p>
          <h1
            id="app-error-title"
            className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold"
          >
            Something Went Wrong
          </h1>
          <p className="text-sm text-chocobo-muted leading-relaxed">
            We couldn&rsquo;t load this ledger view right now. Please try again—your data is safe
            and no changes were lost.
          </p>
          {error.digest && (
            <p className="text-xs text-chocobo-muted pt-1 tabular-nums">
              Reference ID: <code className="text-chocobo-light">{error.digest}</code>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-md bg-chocobo-gold hover:bg-chocobo-gold-bright text-chocobo-dark text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-md border border-chocobo-gold/45 hover:border-chocobo-gold hover:bg-chocobo-gold/10 text-chocobo-gold text-sm font-semibold transition-colors"
          >
            Return to Tracker
          </Link>
        </div>
      </section>
    </main>
  );
}
