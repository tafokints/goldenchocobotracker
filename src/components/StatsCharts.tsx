'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
}

export default function StatsCharts({
  priceRanges,
  findsByMonth,
  priceHistory,
  gradingStats,
}: StatsChartsProps) {
  return (
    <div className="space-y-8">
      {/* Price Range Distribution */}
      <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
        <h2 className="text-xl font-bold text-chocobo-gold mb-4">Price Distribution</h2>
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

      {/* Finds Over Time */}
      {findsByMonth.length > 0 && (
        <div className="bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold">
          <h2 className="text-xl font-bold text-chocobo-gold mb-4">Discovery Timeline</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={findsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
              <XAxis dataKey="month" stroke="#D6A73D" />
              <YAxis allowDecimals={false} stroke="#D6A73D" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
              <Line
                type="monotone"
                dataKey="count"
                name="Cards Found"
                stroke="#D6A73D"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
