import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-chocobo-gold/15 mt-10 sm:mt-12 bg-chocobo-recessed/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 text-xs text-chocobo-muted">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-display text-sm text-chocobo-gold font-semibold tracking-wide">
              Golden Chocobo Tracker
            </p>
            <p className="mt-0.5 text-chocobo-muted">
              Community-verified ledger of serialized MTG &times; Final Fantasy cards.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-1.5 sm:gap-y-2"
          >
            <Link href="/" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              Tracker
            </Link>
            <Link href="/stats" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              Stats
            </Link>
            <Link href="/hub" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              All Trackers
            </Link>
            <Link href="/submit" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              Submit Update
            </Link>
            <Link href="/methodology" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              Methodology
            </Link>
            <Link href="/privacy" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              Privacy
            </Link>
            <a href="/feed.xml" className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors">
              RSS Feed
            </a>
            <a
              href="/api/export?format=csv"
              className="py-1.5 px-1 sm:py-0.5 sm:px-0 hover:text-chocobo-gold transition-colors"
            >
              CSV Export
            </a>
            <Link
              href="/admin"
              className="py-1.5 px-1 sm:py-0.5 sm:px-0 text-chocobo-muted hover:text-chocobo-gold transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>

        <p className="pt-3 border-t border-chocobo-gold/10 text-[11px] text-chocobo-muted/90 text-center sm:text-left leading-relaxed">
          Unofficial community fan ledger &mdash; not affiliated with, endorsed, or sponsored by
          Wizards of the Coast or Square Enix. Magic: The Gathering and Final Fantasy are
          trademarks of their respective owners.
        </p>
      </div>
    </footer>
  );
}
