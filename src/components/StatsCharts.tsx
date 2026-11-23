'use client';

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
import type { ComputedStats } from '@/lib/stats';

const COLORS = ['#D6A73D', '#FFD700', '#FFA500', '#FF8C00', '#FF6347'];

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
  return (
    <div className="space-y-8">
      {/* Cumulative Discovery Curve + Monthly Pulls */}
      {findsByMonth.length > 0 && (
        <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
          <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
            <h2 className="text-xl font-bold text-chocobo-gold">
              Cumulative Discovery Curve &amp; Monthly Pulls
            </h2>
            <span className="text-xs text-chocobo-light/70">
              Bars = monthly finds · Line = cumulative total found
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={findsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
              <XAxis dataKey="month" stroke="#D6A73D" />
              <YAxis yAxisId="left" allowDecimals={false} stroke="#D6A73D" />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} stroke="#4ADE80" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
              <Bar yAxisId="left" dataKey="count" name="Monthly Pulls" fill="rgba(214, 167, 61, 0.55)" />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Found"
                stroke="#4ADE80"
                fill="rgba(74, 222, 128, 0.15)"
                strokeWidth={2.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Price Range Distribution */}
      <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
        <h2 className="text-xl font-bold text-chocobo-gold mb-4">Sale Price Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceRanges}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
            <XAxis dataKey="range" stroke="#D6A73D" />
            <YAxis allowDecimals={false} stroke="#D6A73D" />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
            <Bar dataKey="count" name="Cards" fill="#D6A73D" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reported Sale Price History */}
      {priceHistory.length > 1 && (
        <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
          <h2 className="text-xl font-bold text-chocobo-gold mb-4">Reported Sale Price Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
              <XAxis dataKey="date" stroke="#D6A73D" />
              <YAxis
                stroke="#D6A73D"
                tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }}
                formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Reported Sale']}
              />
              <Line
                type="monotone"
                dataKey="price"
                name="Sale Price"
                stroke="#4ADE80"
                strokeWidth={2}
                dot={{ fill: '#D6A73D', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grading Statistics */}
      {gradingStats.totalGraded > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
            <h2 className="text-xl font-bold text-chocobo-gold mb-4">Grade Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradingStats.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload, percent }) =>
                    `${payload?.grade ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={85}
                  fill="#D6A73D"
                  dataKey="count"
                  nameKey="grade"
                >
                  {gradingStats.gradeDistribution.map((entry, index) => (
                    <Cell key={entry.grade} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
            <h2 className="text-xl font-bold text-chocobo-gold mb-4">Grading Services</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradingStats.serviceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                <XAxis dataKey="service" stroke="#D6A73D" />
                <YAxis allowDecimals={false} stroke="#D6A73D" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                <Bar dataKey="count" name="Graded Cards" fill="#D6A73D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Optional Provenance Charts (shown automatically once Pull Channel / Region data is populated) */}
      {(pullChannelDistribution.length > 0 || regionDistribution.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pullChannelDistribution.length > 0 && (
            <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
              <h2 className="text-xl font-bold text-chocobo-gold mb-4">Pull Origin Breakdown</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pullChannelDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                  <XAxis type="number" allowDecimals={false} stroke="#D6A73D" />
                  <YAxis type="category" dataKey="channel" width={140} stroke="#D6A73D" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                  <Bar dataKey="count" name="Pulls" fill="#D6A73D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {regionDistribution.length > 0 && (
            <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
              <h2 className="text-xl font-bold text-chocobo-gold mb-4">Pulls by Region</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                  <XAxis dataKey="region" stroke="#D6A73D" />
                  <YAxis allowDecimals={false} stroke="#D6A73D" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                  <Bar dataKey="count" name="Pulls" fill="#4ADE80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
