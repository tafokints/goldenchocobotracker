'use client';

import { useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  embedded?: boolean;
}

export default function FilterControls({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  embedded = false,
}: FilterControlsProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const slashShortcutAtRef = useRef<number>(0);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Avoid stealing focus while a modal dialog (Quick View or Lightbox) is open
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (searchInputRef.current) {
        event.preventDefault();
        event.stopPropagation();
        slashShortcutAtRef.current = Date.now();
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div
      className={
        embedded
          ? 'grid grid-cols-2 md:grid-cols-12 gap-2 sm:gap-2.5'
          : 'w-full mt-4 sm:mt-5 grid grid-cols-2 md:grid-cols-12 gap-2 sm:gap-2.5 p-2.5 sm:p-3 bg-chocobo-surface border border-chocobo-gold/25 rounded-lg'
      }
    >
      {/* Search Input */}
      <div className="relative col-span-2 md:col-span-6">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search #, finder, region, grail..."
          aria-label="Search by card number, finder, region, or grail"
          aria-keyshortcuts="/"
          value={searchQuery}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (
              slashShortcutAtRef.current > 0 &&
              Date.now() - slashShortcutAtRef.current < 250 &&
              nextValue === '/'
            ) {
              slashShortcutAtRef.current = 0;
              e.target.value = searchQuery;
              return;
            }
            slashShortcutAtRef.current = 0;
            setSearchQuery(nextValue);
          }}
          onKeyDown={(e) => {
            // Any subsequent keydown directly on the focused input is an intentional keystroke
            slashShortcutAtRef.current = 0;
            if (e.key === 'Escape') {
              if (searchQuery) {
                e.preventDefault();
                setSearchQuery('');
              } else {
                searchInputRef.current?.blur();
              }
            }
          }}
          className="w-full h-10 sm:h-9 bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-light placeholder:text-chocobo-muted/70 text-base sm:text-sm rounded-md py-1.5 pl-9 pr-9 focus-visible:outline-none focus-visible:border-chocobo-gold focus-visible:ring-1 focus-visible:ring-chocobo-gold"
        />
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-chocobo-muted pointer-events-none" />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
            aria-label="Clear search"
            title="Clear search (Esc)"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-chocobo-muted hover:text-chocobo-light focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-chocobo-gold transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            title="Press / to search"
            className="hidden sm:inline-flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 h-5 min-w-[1.25rem] px-1 rounded border border-chocobo-gold/25 bg-chocobo-surface/80 text-[11px] font-sans font-medium text-chocobo-muted/85 pointer-events-none select-none"
          >
            /
          </kbd>
        )}
      </div>

      {/* Status Filter */}
      <div className="col-span-1 md:col-span-3">
        <select
          aria-label="Filter by discovery status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full h-10 sm:h-9 bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-light text-base sm:text-sm rounded-md py-1.5 px-2 sm:px-3 truncate focus-visible:outline-none focus-visible:border-chocobo-gold focus-visible:ring-1 focus-visible:ring-chocobo-gold"
        >
          <option value="all">All Statuses</option>
          <option value="found">Found Only</option>
          <option value="not-found">Unpulled Only</option>
        </select>
      </div>

      {/* Sort Order */}
      <div className="col-span-1 md:col-span-3">
        <select
          aria-label="Sort cards"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full h-10 sm:h-9 bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-light text-base sm:text-sm rounded-md py-1.5 px-2 sm:px-3 truncate focus-visible:outline-none focus-visible:border-chocobo-gold focus-visible:ring-1 focus-visible:ring-chocobo-gold"
        >
          <option value="id-asc">Serial: 01 → 77</option>
          <option value="id-desc">Serial: 77 → 01</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="date-desc">Date: Newest</option>
          <option value="date-asc">Date: Oldest</option>
        </select>
      </div>
    </div>
  );
}
