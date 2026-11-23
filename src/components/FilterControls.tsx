'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  return (
    <div
      className={
        embedded
          ? 'grid grid-cols-1 md:grid-cols-12 gap-2.5'
          : 'w-full mt-5 grid grid-cols-1 md:grid-cols-12 gap-2.5 p-3 bg-chocobo-surface border border-chocobo-gold/25 rounded-lg'
      }
    >
      {/* Search Input */}
      <div className="relative md:col-span-6">
        <input
          type="text"
          placeholder="Search card #, finder, region, or grail..."
          aria-label="Search by card number, finder, region, or grail"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-light placeholder:text-chocobo-muted/70 text-sm rounded-md py-1.5 pl-9 pr-3 focus-visible:outline-none focus-visible:border-chocobo-gold focus-visible:ring-1 focus-visible:ring-chocobo-gold"
        />
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-chocobo-muted pointer-events-none" />
      </div>

      {/* Status Filter */}
      <div className="md:col-span-3">
        <select
          aria-label="Filter by discovery status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full h-9 bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-light text-sm rounded-md py-1.5 px-3 focus-visible:outline-none focus-visible:border-chocobo-gold focus-visible:ring-1 focus-visible:ring-chocobo-gold"
        >
          <option value="all">All Statuses</option>
          <option value="found">Found Only</option>
          <option value="not-found">Unpulled Only</option>
        </select>
      </div>

      {/* Sort Order */}
      <div className="md:col-span-3">
        <select
          aria-label="Sort cards"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full h-9 bg-chocobo-recessed border border-chocobo-gold/25 text-chocobo-light text-sm rounded-md py-1.5 px-3 focus-visible:outline-none focus-visible:border-chocobo-gold focus-visible:ring-1 focus-visible:ring-chocobo-gold"
        >
          <option value="id-asc">Serial # (01 → 77)</option>
          <option value="id-desc">Serial # (77 → 01)</option>
          <option value="price-desc">Price (High → Low)</option>
          <option value="price-asc">Price (Low → High)</option>
          <option value="date-desc">Date Found (Newest)</option>
          <option value="date-asc">Date Found (Oldest)</option>
        </select>
      </div>
    </div>
  );
}
