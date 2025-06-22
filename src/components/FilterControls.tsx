'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface FilterControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}

export default function FilterControls({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
}: FilterControlsProps) {
  return (
    <div className="w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-chocobo-dark bg-opacity-75 rounded-lg">
      {/* Search Input */}
      <div className="relative col-span-1 md:col-span-1">
        <input
          type="text"
          placeholder="Search by card #"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-chocobo-light border border-chocobo-gold text-chocobo-dark rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-chocobo-gold"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-chocobo-dark" />
      </div>

      {/* Filter and Sort Dropdowns */}
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-chocobo-light border border-chocobo-gold text-chocobo-dark rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-chocobo-gold"
          >
            <option value="all">Show All</option>
            <option value="found">Show Found</option>
            <option value="not-found">Show Not Found</option>
          </select>
        </div>
        <div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full bg-chocobo-light border border-chocobo-gold text-chocobo-dark rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-chocobo-gold"
          >
            <option value="id-asc">Sort by ID (Asc)</option>
            <option value="id-desc">Sort by ID (Desc)</option>
            <option value="price-desc">Sort by Price (High-Low)</option>
            <option value="price-asc">Sort by Price (Low-High)</option>
            <option value="date-desc">Sort by Date (Newest)</option>
            <option value="date-asc">Sort by Date (Oldest)</option>
          </select>
        </div>
      </div>
    </div>
  );
} 