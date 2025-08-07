'use client';

import { useState, useEffect, useMemo } from 'react';
import { Redis } from '@upstash/redis';
import { ChocoboCard, GradingInfo, PriceHistoryEntry } from "../lib/types";
import Link from "next/link";
import AffiliateLinks from "../components/AffiliateLinks";
import ReportButton from '../components/ReportButton';
import AdminPanel from '../components/AdminPanel';
import ProgressBar from '../components/ProgressBar';
import FilterControls from '../components/FilterControls';
import CardDetails from '../components/CardDetails';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Head from 'next/head';

const redis = Redis.fromEnv();

export default function Home() {
  const [cards, setCards] = useState<ChocoboCard[]>([]);
  const [loading, setLoading] = useState(true);

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('id-asc');
  
  // State for lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // State for card details
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<ChocoboCard | null>(null);

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

  const handleImageUpdate = async (cardId: number, imageUrl: string) => {
    try {
      const response = await fetch('/api/update-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId, imageUrl }),
      });

      if (response.ok) {
        // Refresh the cards data
        fetchCards();
      }
    } catch (error) {
      console.error('Error updating image:', error);
    }
  };

  const handleGradingUpdate = async (cardId: number, grading: GradingInfo) => {
    try {
      const response = await fetch('/api/update-grading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId, grading }),
      });

      if (response.ok) {
        // Refresh the cards data
        fetchCards();
      }
    } catch (error) {
      console.error('Error updating grading:', error);
    }
  };

  const handlePriceHistoryAdd = async (cardId: number, entry: PriceHistoryEntry) => {
    try {
      const response = await fetch('/api/add-price-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId, entry }),
      });

      if (response.ok) {
        // Refresh the cards data
        fetchCards();
      }
    } catch (error) {
      console.error('Error adding price history:', error);
    }
  };

  const filteredAndSortedCards = useMemo(() => {
    return cards
      .filter(card => {
        // Search query filter
        const matchesSearch = card.id.toString().padStart(2, '0').includes(searchQuery);

        // Status filter
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'found' && card.found) ||
          (statusFilter === 'not-found' && !card.found);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'id-desc':
            return b.id - a.id;
          case 'price-asc':
            return (a.price ?? Infinity) - (b.price ?? Infinity);
          case 'price-desc':
            return (b.price ?? -1) - (a.price ?? -1);
          case 'date-asc':
            return new Date(a.dateFound ?? 0).getTime() - new Date(b.dateFound ?? 0).getTime();
          case 'date-desc':
            return new Date(b.dateFound ?? 0).getTime() - new Date(a.dateFound ?? 0).getTime();
          case 'id-asc':
          default:
            return a.id - b.id;
        }
      });
  }, [cards, searchQuery, statusFilter, sortOrder]);

  const lightboxSlides = useMemo(() => {
    return filteredAndSortedCards
      .map(card => card.image || `/images/chocobo-${card.id.toString().padStart(2, '0')}.jpg`)
      .map(src => ({ src }));
  }, [filteredAndSortedCards]);

  const foundCards = cards.filter((card) => card.found);
  const foundCount = foundCards.length;
  const totalCount = cards.length;

  const lastFoundCard = foundCards.sort((a, b) => {
    if (!a.dateFound || !b.dateFound) return 0;
    return new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime();
  })[0];

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Golden Chocobo Tracker",
    "description": "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration",
    "url": "https://goldenchocobotracker.com",
    "applicationCategory": "EntertainmentApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-chocobo-gold text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="flex min-h-screen flex-col items-center p-8 md:p-12">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold mb-4 lg:mb-0">
            Golden Chocobo Tracker
          </h1>
          <div className="flex items-center space-x-4">
            <Link href="/stats" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
              Stats
            </Link>
            <ReportButton />
          </div>
        </div>

        <div className="w-full max-w-5xl mt-6 text-center bg-chocobo-dark bg-opacity-75 p-6 rounded-lg">
          <ProgressBar current={foundCount} total={totalCount} />
          {lastFoundCard && (
            <p className="text-chocobo-light mt-4 text-sm">
              Last find: #{lastFoundCard.id.toString().padStart(2, '0')} by {lastFoundCard.foundBy} on {lastFoundCard.dateFound}
            </p>
          )}
        </div>

        <FilterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <section className="w-full max-w-5xl mt-8" aria-label="Golden Chocobo Cards">
          <h2 className="sr-only">Golden Chocobo Card Collection</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedCards.map((card, index) => {
              const imageSrc = card.image || `/images/chocobo-${card.id.toString().padStart(2, '0')}.jpg`;
              
              return (
                <article key={card.id} className="border border-chocobo-gold rounded-lg p-4 bg-chocobo-dark shadow-[0_0_15px_rgba(214,167,61,0.5)] flex flex-col">
                  <div 
                    className="aspect-square mb-3 bg-chocobo-light rounded overflow-hidden cursor-pointer"
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View larger image of Golden Chocobo Card #${card.id.toString().padStart(2, '0')}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt={`Golden Chocobo Card #${card.id.toString().padStart(2, '0')} - ${card.name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const container = target.parentElement;
                        if (container) {
                          (container as HTMLElement).style.display = 'none';
                        }
                      }}
                    />
                  </div>
                  
                  <h3 className="text-lg font-bold text-chocobo-gold">#{card.id.toString().padStart(2, '0')}</h3>
                  
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

                    {card.grading && (
                      <div className="text-sm mt-2 text-blue-400">
                        <p>{card.grading.service} {card.grading.grade}</p>
                        {card.grading.dateGraded && <p className="text-xs text-chocobo-light">{card.grading.dateGraded}</p>}
                      </div>
                    )}
                    
                    {card.found && (
                      <div className="text-sm mt-2 text-chocobo-light">
                        <p>Found by: {card.foundBy}</p>
                        <p>Date: {card.dateFound}</p>
                        {card.link && <a href={card.link} target="_blank" rel="noopener noreferrer" className="text-chocobo-gold hover:underline">{card.link.toLowerCase().includes('ebay') ? 'Buy on eBay' : 'Source'}</a>}
                      </div>
                    )}

                    {/* Details button */}
                    <button
                      onClick={() => setSelectedCardForDetails(card)}
                      className="w-full mt-3 bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides}
          index={lightboxIndex}
        />

        <AffiliateLinks />
        <AdminPanel 
          cards={cards} 
          onPriceUpdate={handlePriceUpdate} 
          onImageUpdate={handleImageUpdate}
          onGradingUpdate={handleGradingUpdate}
          onPriceHistoryAdd={handlePriceHistoryAdd}
        />
        {selectedCardForDetails && (
          <CardDetails
            card={selectedCardForDetails}
            isOpen={!!selectedCardForDetails}
            onClose={() => setSelectedCardForDetails(null)}
          />
        )}
      </main>
    </>
  );
}
