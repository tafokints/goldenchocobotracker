'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { href: '/', label: 'Tracker' },
  { href: '/stats', label: 'Stats' },
  { href: '/hub', label: 'All Trackers' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const isNavItemActive = (href: string) =>
    href === '/'
      ? pathname === '/' || pathname.startsWith('/card/')
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="w-full border-b border-chocobo-gold/20 bg-chocobo-dark/95">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-3 sm:gap-4">
        <Link
          href="/"
          className="font-display text-base sm:text-xl font-bold tracking-wide text-chocobo-gold hover:text-chocobo-gold-bright transition-colors truncate py-1"
        >
          Golden Chocobo
        </Link>

        {/* Desktop Single-Row Navigation */}
        <nav
          className="hidden sm:flex items-center gap-5 md:gap-6 text-sm"
          aria-label="Primary navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item.href);

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
            aria-current={pathname === '/submit' ? 'page' : undefined}
            className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded border border-chocobo-gold/70 text-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark transition-colors shrink-0"
          >
            Submit Update
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle (< sm) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-primary-nav"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="sm:hidden inline-flex items-center justify-center min-w-[42px] min-h-[42px] -mr-1 rounded-md border border-chocobo-gold/25 bg-chocobo-surface/80 text-chocobo-gold hover:border-chocobo-gold/60 hover:bg-chocobo-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chocobo-gold"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer (< sm) */}
      {mobileMenuOpen && (
        <nav
          id="mobile-primary-nav"
          aria-label="Mobile navigation"
          className="sm:hidden border-t border-chocobo-gold/15 bg-chocobo-surface px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium border-l-2 transition-colors ${
                  isActive
                    ? 'bg-chocobo-gold/10 text-chocobo-gold border-chocobo-gold'
                    : 'text-chocobo-light/90 border-transparent hover:bg-chocobo-recessed/70 hover:text-chocobo-gold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-chocobo-gold/15">
            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={pathname === '/submit' ? 'page' : undefined}
              className="block w-full text-center text-sm font-semibold px-3 py-2.5 rounded-md border border-chocobo-gold/70 text-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark transition-colors"
            >
              Submit Update
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
