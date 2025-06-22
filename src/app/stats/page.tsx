'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChocoboCard } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Link from 'next/link';

export default function StatsPage() {
  const [cards, setCards] = useState<ChocoboCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      });
  }, []);

  const foundCards = useMemo(() => cards.filter(c => c.found), [cards]);

  const stats = useMemo(() => {
    if (foundCards.length === 0) {
      return {
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: Infinity,
        findsByMonth: [],
      };
    }

    const prices = foundCards.map(c => c.price).filter(p => p != null) as number[];
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);

    const findsByMonth = foundCards.reduce((acc, card) => {
      if (card.dateFound) {
        const month = new Date(card.dateFound).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const findsByMonthChartData = Object.entries(findsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      averagePrice: averagePrice || 0,
      highestPrice,
      lowestPrice,
      findsByMonth: findsByMonthChartData,
    };
  }, [foundCards]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-chocobo-gold text-xl">Loading Stats...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold">
          Statistics
        </h1>
        <Link href="/" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
          &larr; Back to Tracker
        </Link>
      </div>

      {foundCards.length === 0 ? (
        <div className="text-center text-chocobo-light">No cards found yet. Check back later for stats!</div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
            <h3 className="text-lg font-bold text-chocobo-light">Average Sale Price</h3>
            <p className="text-3xl font-bold text-chocobo-gold mt-2">${stats.averagePrice.toFixed(2)}</p>
          </div>
          <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
            <h3 className="text-lg font-bold text-chocobo-light">Highest Sale Price</h3>
            <p className="text-3xl font-bold text-chocobo-gold mt-2">${stats.highestPrice.toLocaleString()}</p>
          </div>
          <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
            <h3 className="text-lg font-bold text-chocobo-light">Lowest Sale Price</h3>
            <p className="text-3xl font-bold text-chocobo-gold mt-2">${stats.lowestPrice.toLocaleString()}</p>
          </div>

          {/* Finds Over Time Chart */}
          <div className="md:col-span-3 bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold mt-6">
            <h3 className="text-xl font-bold text-chocobo-gold mb-4">Finds Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.findsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                <XAxis dataKey="month" stroke="#D6A73D" />
                <YAxis allowDecimals={false} stroke="#D6A73D" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                <Legend />
                <Line type="monotone" dataKey="count" name="Cards Found" stroke="#D6A73D" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </main>
  );
} 