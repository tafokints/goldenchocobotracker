'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChocoboCard } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';
import Head from 'next/head';

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
  const gradedCards = useMemo(() => foundCards.filter(c => c.grading), [foundCards]);

  const stats = useMemo(() => {
    if (foundCards.length === 0) {
      return {
        totalCards: 77,
        foundCount: 0,
        foundPercentage: 0,
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        totalValue: 0,
        findsByMonth: [],
        priceHistory: [],
        gradingStats: {
          totalGraded: 0,
          averageGrade: 0,
          gradeDistribution: [],
          serviceDistribution: []
        },
        topFinders: [],
        recentDiscoveries: [],
        priceRanges: []
      };
    }

    const prices = foundCards.map(c => c.price).filter(p => p != null) as number[];
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const totalValue = prices.reduce((a, b) => a + b, 0);

    // Finds by month
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

    // Price history trends
    const allPriceHistory = foundCards.flatMap(card => 
      card.priceHistory?.map(entry => ({
        date: entry.date,
        price: entry.price,
        cardId: card.id
      })) || []
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Grading statistics
    const gradingStats = {
      totalGraded: gradedCards.length,
      averageGrade: gradedCards.length > 0 
        ? gradedCards.reduce((sum, card) => sum + (card.grading?.grade || 0), 0) / gradedCards.length 
        : 0,
      gradeDistribution: gradedCards.reduce((acc, card) => {
        const grade = card.grading?.grade;
        if (grade !== undefined) {
          const gradeKey = grade.toString();
          acc[gradeKey] = (acc[gradeKey] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      serviceDistribution: gradedCards.reduce((acc, card) => {
        const service = card.grading?.service;
        if (service) {
          acc[service] = (acc[service] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    // Top finders
    const finderCounts = foundCards.reduce((acc, card) => {
      if (card.foundBy) {
        acc[card.foundBy] = (acc[card.foundBy] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topFinders = Object.entries(finderCounts)
      .map(([finder, count]) => ({ finder, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent discoveries (last 10)
    const recentDiscoveries = foundCards
      .filter(card => card.dateFound)
      .sort((a, b) => new Date(b.dateFound!).getTime() - new Date(a.dateFound!).getTime())
      .slice(0, 10);

    // Price ranges
    const priceRanges = [
      { range: 'Under $10k', count: prices.filter(p => p < 10000).length },
      { range: '$10k-$25k', count: prices.filter(p => p >= 10000 && p < 25000).length },
      { range: '$25k-$50k', count: prices.filter(p => p >= 25000 && p < 50000).length },
      { range: '$50k-$100k', count: prices.filter(p => p >= 50000 && p < 100000).length },
      { range: '$100k+', count: prices.filter(p => p >= 100000).length }
    ];

    return {
      totalCards: 77,
      foundCount: foundCards.length,
      foundPercentage: (foundCards.length / 77) * 100,
      averagePrice,
      highestPrice,
      lowestPrice,
      totalValue,
      findsByMonth: findsByMonthChartData,
      priceHistory: allPriceHistory,
      gradingStats,
      topFinders,
      recentDiscoveries,
      priceRanges
    };
  }, [foundCards, gradedCards]);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Golden Chocobo Statistics",
    "description": "Comprehensive statistics and analytics for Golden Chocobo card discoveries, including grading data, price trends, and discovery patterns",
    "url": "https://goldenchocobotracker.com/stats",
    "mainEntity": {
      "@type": "Dataset",
      "name": "Golden Chocobo Card Statistics",
      "description": "Detailed statistics for 77 serialized Golden Chocobo cards from MTG Final Fantasy",
      "numberOfItems": foundCards.length,
      "temporalCoverage": "2024-01-01/2024-12-31"
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-chocobo-gold text-xl">Loading Stats...</div>
      </main>
    );
  }

  const COLORS = ['#D6A73D', '#FFD700', '#FFA500', '#FF8C00', '#FF6347'];

  return (
    <>
      <Head>
        <title>Statistics | Golden Chocobo Tracker</title>
        <meta name="description" content="Comprehensive statistics and analytics for Golden Chocobo card discoveries, including grading data, price trends, and discovery patterns." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="flex min-h-screen flex-col items-center p-8 md:p-12">
        <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold">
            Golden Chocobo Statistics
          </h1>
          <Link href="/" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
            &larr; Back to Tracker
          </Link>
        </div>

        {foundCards.length === 0 ? (
          <div className="text-center text-chocobo-light">No cards found yet. Check back later for stats!</div>
        ) : (
          <div className="w-full max-w-7xl space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h3 className="text-lg font-bold text-chocobo-light">Cards Found</h3>
                <p className="text-3xl font-bold text-chocobo-gold mt-2">{stats.foundCount}/{stats.totalCards}</p>
                <p className="text-sm text-chocobo-light mt-1">{stats.foundPercentage.toFixed(1)}% Complete</p>
              </div>
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h3 className="text-lg font-bold text-chocobo-light">Total Value</h3>
                <p className="text-3xl font-bold text-chocobo-gold mt-2">${stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-chocobo-light mt-1">All Found Cards</p>
              </div>
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h3 className="text-lg font-bold text-chocobo-light">Average Price</h3>
                <p className="text-3xl font-bold text-chocobo-gold mt-2">${stats.averagePrice.toLocaleString()}</p>
                <p className="text-sm text-chocobo-light mt-1">Per Card</p>
              </div>
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold text-center">
                <h3 className="text-lg font-bold text-chocobo-light">Graded Cards</h3>
                <p className="text-3xl font-bold text-chocobo-gold mt-2">{stats.gradingStats.totalGraded}</p>
                <p className="text-sm text-chocobo-light mt-1">Avg Grade: {stats.gradingStats.averageGrade.toFixed(1)}</p>
              </div>
            </div>

            {/* Price Range Distribution */}
            <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
              <h3 className="text-xl font-bold text-chocobo-gold mb-4">Price Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.priceRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                  <XAxis dataKey="range" stroke="#D6A73D" />
                  <YAxis allowDecimals={false} stroke="#D6A73D" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                  <Bar dataKey="count" fill="#D6A73D" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Grading Statistics */}
            {stats.gradingStats.totalGraded > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
                  <h3 className="text-xl font-bold text-chocobo-gold mb-4">Grade Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.gradingStats.gradeDistribution).map(([grade, count]) => ({ grade, count }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ grade, percent }) => `${grade} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {Object.entries(stats.gradingStats.gradeDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
                  <h3 className="text-xl font-bold text-chocobo-gold mb-4">Grading Services</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.gradingStats.serviceDistribution).map(([service, count]) => ({ service, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                      <XAxis dataKey="service" stroke="#D6A73D" />
                      <YAxis allowDecimals={false} stroke="#D6A73D" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                      <Bar dataKey="count" fill="#D6A73D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Finds Over Time */}
            <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
              <h3 className="text-xl font-bold text-chocobo-gold mb-4">Discovery Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.findsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 167, 61, 0.2)" />
                  <XAxis dataKey="month" stroke="#D6A73D" />
                  <YAxis allowDecimals={false} stroke="#D6A73D" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D6A73D' }} />
                  <Line type="monotone" dataKey="count" name="Cards Found" stroke="#D6A73D" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Finders and Recent Discoveries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
                <h3 className="text-xl font-bold text-chocobo-gold mb-4">Top Discoverers</h3>
                <div className="space-y-2">
                  {stats.topFinders.map((finder, index) => (
                    <div key={finder.finder} className="flex justify-between items-center">
                      <span className="text-chocobo-light">
                        {index + 1}. {finder.finder}
                      </span>
                      <span className="text-chocobo-gold font-bold">{finder.count} cards</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
                <h3 className="text-xl font-bold text-chocobo-gold mb-4">Recent Discoveries</h3>
                <div className="space-y-2">
                  {stats.recentDiscoveries.map((card) => (
                    <div key={card.id} className="flex justify-between items-center">
                      <span className="text-chocobo-light">
                        #{card.id.toString().padStart(2, '0')} - {card.foundBy}
                      </span>
                      <span className="text-chocobo-gold font-bold">
                        ${card.price?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Extremes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
                <h3 className="text-xl font-bold text-chocobo-gold mb-4">Highest Priced Cards</h3>
                <div className="space-y-2">
                  {foundCards
                    .filter(card => card.price)
                    .sort((a, b) => (b.price || 0) - (a.price || 0))
                    .slice(0, 5)
                    .map((card) => (
                      <div key={card.id} className="flex justify-between items-center">
                        <span className="text-chocobo-light">
                          #{card.id.toString().padStart(2, '0')} - {card.foundBy}
                        </span>
                        <span className="text-chocobo-gold font-bold">
                          ${card.price?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-chocobo-dark bg-opacity-75 p-6 rounded-lg border border-chocobo-gold">
                <h3 className="text-xl font-bold text-chocobo-gold mb-4">Lowest Priced Cards</h3>
                <div className="space-y-2">
                  {foundCards
                    .filter(card => card.price)
                    .sort((a, b) => (a.price || 0) - (b.price || 0))
                    .slice(0, 5)
                    .map((card) => (
                      <div key={card.id} className="flex justify-between items-center">
                        <span className="text-chocobo-light">
                          #{card.id.toString().padStart(2, '0')} - {card.foundBy}
                        </span>
                        <span className="text-chocobo-gold font-bold">
                          ${card.price?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 