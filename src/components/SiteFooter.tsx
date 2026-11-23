import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-chocobo-gold/15 mt-12 bg-chocobo-recessed/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-chocobo-muted">
        <div className="text-center sm:text-left">
          <p className="font-display text-sm text-chocobo-gold/90 font-semibold tracking-wide">
            Golden Chocobo Tracker
          </p>
          <p className="mt-0.5 text-chocobo-muted/80">
            Community-verified ledger of serialized MTG &times; Final Fantasy cards.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          <Link href="/" className="py-0.5 hover:text-chocobo-gold transition-colors">
            Tracker
          </Link>
          <Link href="/stats" className="py-0.5 hover:text-chocobo-gold transition-colors">
            Stats
          </Link>
          <Link href="/hub" className="py-0.5 hover:text-chocobo-gold transition-colors">
            All Trackers
          </Link>
          <Link href="/submit" className="py-0.5 hover:text-chocobo-gold transition-colors">
            Submit Update
          </Link>
          <a href="/feed.xml" className="py-0.5 hover:text-chocobo-gold transition-colors">
            RSS Feed
          </a>
          <a
            href="/api/export?format=csv"
            className="py-0.5 hover:text-chocobo-gold transition-colors"
          >
            CSV Export
          </a>
          <Link
            href="/admin"
            className="py-0.5 text-chocobo-muted/65 hover:text-chocobo-gold transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
