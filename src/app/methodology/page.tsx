import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Verification & Data Methodology',
  description:
    'How Golden Chocobo Tracker verifies serialized pulls, deduplicates reported sales, computes market medians, and tracks PSA/BGS/CGC/TAG population tiers.',
  alternates: {
    canonical: '/methodology',
  },
};

export default function MethodologyPage() {
  return (
    <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-10">
      <article className="max-w-3xl mx-auto bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-5 sm:p-8 space-y-6">
        <header className="border-b border-chocobo-gold/20 pb-4 space-y-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold text-chocobo-gold">
            Data Standards
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold">
            Verification &amp; Grading Methodology
          </h1>
          <p className="text-xs sm:text-sm text-chocobo-muted">
            How every serialized pull, reported sale, and slab certification enters the public
            ledger.
          </p>
        </header>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            1. Pull Verification
          </h2>
          <p>
            A serialized copy (<span className="tabular-nums">#01/77</span> through{' '}
            <span className="tabular-nums">#77/77</span>) is marked{' '}
            <strong className="text-emerald-300">Found</strong> only after human review of
            verifiable evidence—such as a clear serial photo, public pull post (Reddit, X, Discord,
            Instagram, YouTube), store break clip, auction house lot, or grading cert record.
            Unconfirmed rumors remain <strong className="text-chocobo-light">Unpulled</strong> until
            evidence is supplied.
          </p>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            2. Reported Sales, Median vs. Average &amp; Deduplication
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-chocobo-light">Verified Realized Prices:</strong> We log
              completed public auction results (including buyer&rsquo;s premium where standard, e.g.
              Goldin/Heritage/eBay sold listings) and credible documented private transactions.
              Unsold asking prices are excluded from realized sale statistics.
            </li>
            <li>
              <strong className="text-chocobo-light">Outlier Resistance:</strong> Because
              seven-figure trophy sales (such as PSA 10 MBA Gold Diamond copies) skew arithmetic
              averages heavily upward,{' '}
              <Link href="/stats" className="text-chocobo-gold hover:underline">
                Market Statistics
              </Link>{' '}
              prominently reports <strong className="text-chocobo-light">Median Sale Price</strong>{' '}
              alongside Average and provides a{' '}
              <strong className="text-chocobo-light">Logarithmic scale</strong> toggle on the
              Reported Sale Price Trend chart.
            </li>
            <li>
              <strong className="text-chocobo-light">Duplicate Guardrails:</strong> Identical{' '}
              <code className="text-chocobo-gold text-xs">(card, price, date)</code> sale entries
              are automatically prevented on write and deduplicated in analytics so multi-sale flip
              calculations never produce artificial 0% resales.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            3. Grading Tiers &amp; Cert Verification
          </h2>
          <p>
            Graded slabs from <strong className="text-chocobo-light">PSA</strong>,{' '}
            <strong className="text-chocobo-light">BGS</strong>,{' '}
            <strong className="text-chocobo-light">CGC</strong>, and{' '}
            <strong className="text-chocobo-light">TAG</strong> record both numeric grade and
            optional prestige tier designations (for example,{' '}
            <span className="text-sky-300 font-medium">PSA 10 &middot; MBA Gold Diamond</span>,{' '}
            <span className="text-sky-300 font-medium">CGC Pristine 10</span>, or{' '}
            <span className="text-sky-300 font-medium">BGS Black Label 10</span>). Whenever a
            certification number is verified, card pages link directly to the grading company&rsquo;s
            official cert lookup portal.
          </p>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            4. Open Data &amp; Corrections
          </h2>
          <p>
            Spot a new pull, auction result, re-grade, or typo? Submit proof through our{' '}
            <Link href="/submit" className="text-chocobo-gold hover:underline font-medium">
              Community Submission Form
            </Link>
            . Researchers and content creators can also download the live dataset in{' '}
            <a href="/api/export?format=csv" className="text-chocobo-gold hover:underline">
              CSV
            </a>{' '}
            or{' '}
            <a href="/api/export?format=json" className="text-chocobo-gold hover:underline">
              JSON
            </a>{' '}
            format, or subscribe to real-time updates via{' '}
            <a href="/feed.xml" className="text-chocobo-gold hover:underline">
              RSS 2.0
            </a>
            .
          </p>
        </section>

        <footer className="pt-4 border-t border-chocobo-gold/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link href="/stats" className="text-chocobo-gold hover:underline font-medium py-1">
            &larr; View Live Statistics &amp; Pop Report
          </Link>
          <Link href="/privacy" className="text-chocobo-light hover:text-chocobo-gold py-1">
            Privacy &amp; Disclosures &rarr;
          </Link>
        </footer>
      </article>
    </main>
  );
}
