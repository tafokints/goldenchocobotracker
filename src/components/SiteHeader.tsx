'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Tracker' },
  { href: '/stats', label: 'Stats' },
  { href: '/hub', label: 'All Trackers' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-chocobo-gold/20 bg-chocobo-dark/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-lg sm:text-xl font-bold tracking-wide text-chocobo-gold hover:text-chocobo-gold-bright transition-colors truncate"
        >
          Golden Chocobo
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/' || pathname.startsWith('/card/')
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors font-medium py-1 border-b-2 ${
                  isActive
                    ? 'text-chocobo-gold border-chocobo-gold'
                    : 'text-chocobo-muted border-transparent hover:text-chocobo-light'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/submit"
            className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded border border-chocobo-gold/70 text-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark transition-colors shrink-0"
          >
            Submit Update
          </Link>
        </nav>
      </div>
    </header>
  );
}
