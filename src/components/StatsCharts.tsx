'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactUsd } from '@/lib/format';
import type { ComputedStats } from '@/lib/stats';

const GRADE_COLORS = ['#D6A73D', '#4ADE80', '#38BDF8', '#E8C468', '#A78B56', '#C08457'];
const GRID_STROKE = 'rgba(214, 167, 61, 0.16)';
const AXIS_STROKE = 'rgba(214, 167, 61, 0.3)';
const AXIS_TICK = { fill: '#B5A694', fontSize: 11 };

type PriceScaleMode = 'linear' | 'log';
type PriceHistoryPoint = ComputedStats['priceHistory'][number];

interface TooltipEntry {
  name?: string | number;
  value?: number | string | ReadonlyArray<number | string>;
  color?: string;
  fill?: string;
  stroke?: string;
  payload?: unknown;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<TooltipEntry>;
}

function buildLogScaleConfig(prices: number[]): {
  domainMin: number;
  domainMax: number;
  ticks: number[];
} | null {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0);
  if (valid.length === 0) return null;

  const minPrice = Math.min(...valid);
  const maxPrice = Math.max(...valid);
  const minExp = Math.floor(Math.log10(minPrice)) - 1;
  const maxExp = Math.ceil(Math.log10(maxPrice)) + 1;

  const generateCandidates = (multipliers: number[]) => {
    const out: number[] = [];
    for (let exp = minExp; exp <= maxExp; exp++) {
      const base = Math.pow(10, exp);
      for (const mult of multipliers) {
        const val = base * mult;
        if (val > 0) out.push(val);
      }
    }
    return out;
  };

  const candidates = generateCandidates([1, 2, 5]);

  let minIdx = 0;
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] <= minPrice) {
      minIdx = i;
    } else {
      break;
    }
  }

  let maxIdx = candidates.length - 1;
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] >= maxPrice) {
      maxIdx = i;
      break;
    }
  }

  if (minIdx === maxIdx) {
    minIdx = Math.max(0, minIdx - 1);
    maxIdx = Math.min(candidates.length - 1, maxIdx + 1);
  }

  const domainMin = candidates[minIdx];
  const domainMax = candidates[maxIdx];
  let ticks = candidates.slice(minIdx, maxIdx + 1);

  if (ticks.length > 8) {
    const sparser = generateCandidates([1, 5]).filter((v) => v >= domainMin && v <= domainMax);
    ticks = sparser.length > 8
      ? generateCandidates([1]).filter((v) => v >= domainMin && v <= domainMax)
      : sparser;
    if (ticks[0] !== domainMin) ticks = [domainMin, ...ticks];
    if (ticks[ticks.length - 1] !== domainMax) ticks = [...ticks, domainMax];
  }

  return { domainMin, domainMax, ticks };
}

function PriceTrendTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as PriceHistoryPoint | undefined;
  if (!point || typeof point.price !== 'number') return null;

  return (
    <div className="bg-chocobo-dark border border-chocobo-gold/50 rounded-md px-3 py-2 text-xs shadow-xl">
      <p className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-display font-bold text-chocobo-gold">{point.label}</span>
        <span className="text-chocobo-muted">&mdash;</span>
        <span className="font-semibold text-emerald-400 tabular-nums">
          ${point.price.toLocaleString()}
        </span>
      </p>
      <p className="text-chocobo-muted tabular-nums mt-0.5">{point.date}</p>
    </div>
  );
}

function LedgerTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-chocobo-dark border border-chocobo-gold/50 rounded-md px-3 py-2 text-xs shadow-xl space-y-1">
      {label !== undefined && label !== '' && (
        <p className="font-semibold text-chocobo-light tabular-nums">{String(label)}</p>
      )}
      {payload.map((entry, idx) => {
        const numericVal =
          typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
        const swatch = entry.color || entry.stroke || entry.fill || '#D6A73D';
        return (
          <div
            key={`${String(entry.name ?? idx)}-${idx}`}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5 text-chocobo-muted">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: swatch }}
              />
              {String(entry.name ?? 'Value')}
            </span>
            <span className="font-semibold text-chocobo-gold tabular-nums">
              {Number.isFinite(numericVal)
                ? numericVal.toLocaleString()
                : String(entry.value ?? '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GradePieTooltip({
  active,
  payload,
  totalGraded,
}: CustomTooltipProps & { totalGraded: number }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const count = typeof item.value === 'number' ? item.value : Number(item.value ?? 0);
  const pct = totalGraded > 0 ? ((count / totalGraded) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-chocobo-dark border border-chocobo-gold/50 rounded-md px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-chocobo-light">Grade {String(item.name ?? '')}</p>
      <p className="text-chocobo-gold font-semibold tabular-nums mt-0.5">
        {count} {count === 1 ? 'card' : 'cards'}{' '}
        <span className="text-chocobo-muted font-normal">({pct}%)</span>
      </p>
    </div>
  );
}

interface StatsChartsProps {
  priceRanges: ComputedStats['priceRanges'];
  findsByMonth: ComputedStats['findsByMonth'];
  priceHistory: ComputedStats['priceHistory'];
  gradingStats: ComputedStats['gradingStats'];
  pullChannelDistribution?: ComputedStats['pullChannelDistribution'];
  regionDistribution?: ComputedStats['regionDistribution'];
}

export default function StatsCharts({
  priceRanges,
  findsByMonth,
  priceHistory,
  gradingStats,
  pullChannelDistribution = [],
  regionDistribution = [],
}: StatsChartsProps) {
  const [priceScale, setPriceScale] = useState<PriceScaleMode>('linear');

  const positivePriceHistory = useMemo(
    () => priceHistory.filter((entry) => entry.price > 0),
    [priceHistory]
  );

  const canUseLogScale = positivePriceHistory.length >= 2;
  const effectiveScale: PriceScaleMode =
    priceScale === 'log' && canUseLogScale ? 'log' : 'linear';

  const trendData = useMemo(
    () => (effectiveScale === 'log' ? positivePriceHistory : priceHistory),
    [effectiveScale, positivePriceHistory, priceHistory]
  );

  const logScaleConfig = useMemo(
    () =>
      effectiveScale === 'log'
        ? buildLogScaleConfig(positivePriceHistory.map((p) => p.price))
        : null,
    [effectiveScale, positivePriceHistory]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Cumulative Discovery Curve + Monthly Pulls */}
      {findsByMonth.length > 0 && (
        <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25">
          <div className="flex flex-wrap justify-between items-baseline gap-2 mb-3 sm:mb-4">
            <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold">
              Cumulative Discovery Curve &amp; Monthly Pulls
            </h2>
            <span className="text-[11px] sm:text-xs text-chocobo-muted">
              Bars = monthly finds &middot; Line = cumulative total found
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={findsByMonth} margin={{ top: 6, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="month" stroke={AXIS_STROKE} tick={AXIS_TICK} />
              <YAxis
                yAxisId="left"
                allowDecimals={false}
                stroke={AXIS_STROKE}
                tick={AXIS_TICK}
                width={38}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                stroke="rgba(74, 222, 128, 0.35)"
                tick={{ fill: '#86EFAC', fontSize: 11 }}
                width={34}
              />
              <Tooltip
                cursor={{ fill: 'rgba(214, 167, 61, 0.08)' }}
                content={(props) => <LedgerTooltip {...props} />}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Monthly Pulls"
                fill="rgba(214, 167, 61, 0.58)"
                radius={[3, 3, 0, 0]}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Found"
                stroke="#4ADE80"
                fill="rgba(74, 222, 128, 0.14)"
                strokeWidth={2.25}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Price Range Distribution */}
      <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25">
        <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold mb-3 sm:mb-4">
          Sale Price Distribution
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={priceRanges} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="range" stroke={AXIS_STROKE} tick={AXIS_TICK} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} stroke={AXIS_STROKE} tick={AXIS_TICK} width={38} />
            <Tooltip
              cursor={{ fill: 'rgba(214, 167, 61, 0.08)' }}
              content={(props) => <LedgerTooltip {...props} />}
            />
            <Bar dataKey="count" name="Cards" fill="#D6A73D" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reported Sale Price History */}
      {priceHistory.length > 1 && (
        <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25">
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold">
                Reported Sale Price Trend
              </h2>
              <p className="text-[11px] sm:text-xs text-chocobo-muted mt-0.5">
                {effectiveScale === 'log'
                  ? 'Logarithmic scale highlights $40k–$150k market movement alongside seven-figure outliers.'
                  : 'Switch to Log scale to inspect mid-range trends alongside high-value outliers.'}
              </p>
            </div>
            {canUseLogScale && (
              <div
                className="inline-flex rounded-md border border-chocobo-gold/35 overflow-hidden text-xs font-medium bg-chocobo-recessed shrink-0"
                role="group"
                aria-label="Sale price Y-axis scale"
              >
                <button
                  type="button"
                  onClick={() => setPriceScale('linear')}
                  aria-pressed={effectiveScale === 'linear'}
                  className={`min-h-[36px] sm:min-h-0 px-3.5 sm:px-3 py-1.5 sm:py-1 transition-colors ${
                    effectiveScale === 'linear'
                      ? 'bg-chocobo-gold text-chocobo-dark font-semibold'
                      : 'text-chocobo-muted hover:text-chocobo-light'
                  }`}
                >
                  Linear
                </button>
                <button
                  type="button"
                  onClick={() => setPriceScale('log')}
                  aria-pressed={effectiveScale === 'log'}
                  className={`min-h-[36px] sm:min-h-0 px-3.5 sm:px-3 py-1.5 sm:py-1 transition-colors ${
                    effectiveScale === 'log'
                      ? 'bg-chocobo-gold text-chocobo-dark font-semibold'
                      : 'text-chocobo-muted hover:text-chocobo-light'
                  }`}
                >
                  Log
                </button>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              key={effectiveScale}
              data={trendData}
              margin={{ top: 8, right: 18, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="date" stroke={AXIS_STROKE} tick={AXIS_TICK} minTickGap={24} />
              <YAxis
                stroke={AXIS_STROKE}
                tick={AXIS_TICK}
                scale={effectiveScale === 'log' ? 'log' : 'auto'}
                domain={
                  effectiveScale === 'log' && logScaleConfig
                    ? [logScaleConfig.domainMin, logScaleConfig.domainMax]
                    : [0, 'auto']
                }
                ticks={effectiveScale === 'log' && logScaleConfig ? logScaleConfig.ticks : undefined}
                tickFormatter={(value: number) => formatCompactUsd(value)}
                width={52}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(214, 167, 61, 0.45)', strokeDasharray: '3 3' }}
                content={(props) => <PriceTrendTooltip {...props} />}
              />
              <Line
                type="monotone"
                dataKey="price"
                name="Reported Sale"
                stroke="#4ADE80"
                strokeWidth={2}
                dot={{ fill: '#D6A73D', stroke: '#1B1612', strokeWidth: 1.5, r: 4 }}
                activeDot={{ fill: '#E8C468', stroke: '#1B1612', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grading Statistics */}
      {gradingStats.totalGraded > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25 flex flex-col">
            <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold mb-3 sm:mb-4">
              Grade Distribution
            </h2>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={gradingStats.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="#1B1612"
                  strokeWidth={2}
                  fill="#D6A73D"
                  dataKey="count"
                  nameKey="grade"
                >
                  {gradingStats.gradeDistribution.map((entry, index) => (
                    <Cell key={entry.grade} fill={GRADE_COLORS[index % GRADE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <GradePieTooltip {...props} totalGraded={gradingStats.totalGraded} />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Zero-clipping color-swatched ledger legend */}
            <div className="mt-3 pt-3 border-t border-chocobo-gold/15 grid grid-cols-2 gap-2 text-xs">
              {gradingStats.gradeDistribution.map((entry, index) => {
                const pct =
                  gradingStats.totalGraded > 0
                    ? Math.round((entry.count / gradingStats.totalGraded) * 100)
                    : 0;
                return (
                  <div
                    key={entry.grade}
                    className="flex items-center justify-between gap-2 bg-chocobo-recessed/70 border border-chocobo-gold/15 rounded px-2.5 py-1.5 tabular-nums"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: GRADE_COLORS[index % GRADE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-chocobo-light truncate">
                        Grade {entry.grade}
                      </span>
                    </span>
                    <span className="text-chocobo-muted shrink-0">
                      <strong className="text-chocobo-gold">{entry.count}</strong> ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25">
            <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold mb-3 sm:mb-4">
              Grading Services
            </h2>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={gradingStats.serviceDistribution}
                margin={{ top: 6, right: 8, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="service" stroke={AXIS_STROKE} tick={AXIS_TICK} />
                <YAxis allowDecimals={false} stroke={AXIS_STROKE} tick={AXIS_TICK} width={38} />
                <Tooltip
                  cursor={{ fill: 'rgba(214, 167, 61, 0.08)' }}
                  content={(props) => <LedgerTooltip {...props} />}
                />
                <Bar dataKey="count" name="Graded Cards" fill="#D6A73D" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Optional Provenance Charts (shown automatically once Pull Channel / Region data is populated) */}
      {(pullChannelDistribution.length > 0 || regionDistribution.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {pullChannelDistribution.length > 0 && (
            <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25">
              <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold mb-3 sm:mb-4">
                Pull Origin Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pullChannelDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis type="number" allowDecimals={false} stroke={AXIS_STROKE} tick={AXIS_TICK} />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    width={120}
                    stroke={AXIS_STROKE}
                    tick={AXIS_TICK}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(214, 167, 61, 0.08)' }}
                    content={(props) => <LedgerTooltip {...props} />}
                  />
                  <Bar dataKey="count" name="Pulls" fill="#D6A73D" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {regionDistribution.length > 0 && (
            <div className="bg-chocobo-surface p-3.5 sm:p-6 rounded-lg border border-chocobo-gold/25">
              <h2 className="font-display text-base sm:text-xl font-bold text-chocobo-gold mb-3 sm:mb-4">
                Pulls by Region
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={regionDistribution}
                  margin={{ top: 6, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="region" stroke={AXIS_STROKE} tick={AXIS_TICK} />
                  <YAxis allowDecimals={false} stroke={AXIS_STROKE} tick={AXIS_TICK} width={38} />
                  <Tooltip
                    cursor={{ fill: 'rgba(214, 167, 61, 0.08)' }}
                    content={(props) => <LedgerTooltip {...props} />}
                  />
                  <Bar dataKey="count" name="Pulls" fill="#4ADE80" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
