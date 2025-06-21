'use client';

import { useState, useEffect } from 'react';
import { Redis } from '@upstash/redis';
import { ChocoboCard } from "../lib/types";
import Link from "next/link";
import AffiliateLinks from "../components/AffiliateLinks";
import ReportButton from '../components/ReportButton';
import AdminPanel from '../components/AdminPanel';

const redis = Redis.fromEnv();

export default function Home() {
  const [cards, setCards] = useState<ChocoboCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards');
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (cardId: number, price: number) => {
    try {
      const response = await fetch('/api/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId, price }),
      });

      if (response.ok) {
        // Refresh the cards data
        fetchCards();
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const foundCards = cards.filter((card) => card.found);
  const foundCount = foundCards.length;
  const totalCount = cards.length;

  const lastFoundCard = foundCards.sort((a, b) => {
    if (!a.dateFound || !b.dateFound) return 0;
    return new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime();
  })[0];

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-chocobo-gold text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold mb-4 lg:mb-0">
          Golden Chocobo Tracker
        </h1>
        <ReportButton />
      </div>

      <div className="w-full max-w-5xl mt-6 text-center bg-chocobo-dark bg-opacity-75 p-4 rounded-lg">
        <h2 className="text-2xl font-bold text-chocobo-gold">
          {foundCount} / {totalCount} Found
        </h2>
        {lastFoundCard && (
          <p className="text-chocobo-light mt-2">
            Last find: #{lastFoundCard.id.toString().padStart(2, '0')} by {lastFoundCard.foundBy} on {lastFoundCard.dateFound}
          </p>
        )}
      </div>

      <div className="w-full max-w-5xl mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="border border-chocobo-gold rounded-lg p-4 bg-chocobo-dark shadow-[0_0_15px_rgba(214,167,61,0.5)] flex flex-col">
              <div className="aspect-square mb-3 bg-chocobo-light rounded overflow-hidden">
                <img
                  src={card.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzQzNDM0Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNENEE3M0QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DaG9jb2JvICM8L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NzY3NjciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD4KPC9zdmc+'}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzQzNDM0Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNENEE3M0QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DaG9jb2JvICM8L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NzY3NjciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD4KPC9zdmc+';
                  }}
                />
              </div>
              
              <h2 className="text-lg font-bold text-chocobo-gold">#{card.id.toString().padStart(2, '0')}</h2>
              
              <div className="flex-grow">
                <p className={`font-bold ${card.found ? "text-yellow-400" : "text-gray-400"}`}>
                  {card.found ? "Found" : "Not Found"}
                </p>
                
                {card.price && (
                  <div className="text-sm mt-2 text-green-400">
                    <p>Recent Sale: ${card.price.toLocaleString()}</p>
                    {card.priceDate && <p className="text-xs text-chocobo-light">{card.priceDate}</p>}
                  </div>
                )}
                
                {card.found && (
                  <div className="text-sm mt-2 text-chocobo-light">
                    <p>Found by: {card.foundBy}</p>
                    <p>Date: {card.dateFound}</p>
                    {card.link && <a href={card.link} target="_blank" rel="noopener noreferrer" className="text-chocobo-gold hover:underline">Source</a>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AffiliateLinks />
      <AdminPanel cards={cards} onPriceUpdate={handlePriceUpdate} />
    </main>
  );
}
