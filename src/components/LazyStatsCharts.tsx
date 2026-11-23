'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ComputedStats } from '@/lib/stats';

function ChartsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading interactive market charts"
      className="space-y-5 sm:space-y-6"
    >
      <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/20 space-y-3">
        <div className="h-6 w-64 max-w-full rounded bg-chocobo-recessed ledger-shimmer" />
        <div className="h-[280px] w-full rounded bg-chocobo-recessed ledger-shimmer" />
      </div>
      <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/20 space-y-3">
        <div className="h-6 w-52 max-w-full rounded bg-chocobo-recessed ledger-shimmer" />
        <div className="h-[260px] w-full rounded bg-chocobo-recessed ledger-shimmer" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/20 space-y-3">
          <div className="h-6 w-44 rounded bg-chocobo-recessed ledger-shimmer" />
          <div className="h-[250px] w-full rounded bg-chocobo-recessed ledger-shimmer" />
        </div>
        <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/20 space-y-3">
          <div className="h-6 w-44 rounded bg-chocobo-recessed ledger-shimmer" />
          <div className="h-[250px] w-full rounded bg-chocobo-recessed ledger-shimmer" />
        </div>
      </div>
    </div>
  );
}

const StatsChartsDynamic = dynamic(() => import('./StatsCharts'), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

interface LazyStatsChartsProps {
  priceRanges: ComputedStats['priceRanges'];
  findsByMonth: ComputedStats['findsByMonth'];
  priceHistory: ComputedStats['priceHistory'];
  gradingStats: ComputedStats['gradingStats'];
  pullChannelDistribution?: ComputedStats['pullChannelDistribution'];
  regionDistribution?: ComputedStats['regionDistribution'];
}

/**
 * Defers downloading and mounting the Recharts bundle until the charts section
 * approaches the viewport, cutting initial First Load JS on `/stats` significantly.
 */
export default function LazyStatsCharts(props: LazyStatsChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true);
      return;
    }

    const node = containerRef.current;
    if (!node) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  return <div ref={containerRef}>{shouldRender ? <StatsChartsDynamic {...props} /> : <ChartsSkeleton />}</div>;
}
