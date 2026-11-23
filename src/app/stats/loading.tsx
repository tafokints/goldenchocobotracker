export default function StatsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading market and pull statistics"
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-8 space-y-5 sm:space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-chocobo-gold/20 pb-4">
        <div className="space-y-2">
          <div className="h-8 w-64 max-w-full rounded bg-chocobo-surface ledger-shimmer" />
          <div className="h-4 w-80 max-w-full rounded bg-chocobo-surface ledger-shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded bg-chocobo-surface ledger-shimmer" />
          <div className="h-9 w-24 rounded bg-chocobo-surface ledger-shimmer" />
        </div>
      </div>

      {/* 5 KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`${i === 4 ? 'col-span-2 sm:col-span-1' : ''} bg-chocobo-surface p-3.5 sm:p-4 rounded-lg border border-chocobo-gold/20 space-y-2`}
          >
            <div className="h-3.5 w-20 rounded bg-chocobo-recessed ledger-shimmer" />
            <div className="h-7 w-24 rounded bg-chocobo-recessed ledger-shimmer" />
            <div className="h-3 w-28 rounded bg-chocobo-recessed ledger-shimmer" />
          </div>
        ))}
      </div>

      {/* Population Report + Chart Placeholders */}
      <div className="h-64 w-full rounded-lg bg-chocobo-surface border border-chocobo-gold/20 ledger-shimmer" />
      <div className="h-72 w-full rounded-lg bg-chocobo-surface border border-chocobo-gold/20 ledger-shimmer" />
    </main>
  );
}
