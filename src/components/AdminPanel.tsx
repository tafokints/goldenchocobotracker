'use client';

import React, { useState, useEffect } from 'react';
import { ChocoboCard } from '../lib/types';

interface AdminPanelProps {
  cards: ChocoboCard[];
  onPriceUpdate: (cardId: number, price: number) => void;
}

export default function AdminPanel({ cards, onPriceUpdate }: AdminPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Secret code: Ctrl + Alt + A
      if (event.ctrlKey && event.altKey && event.key === 'a') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const handlePriceUpdate = () => {
    if (!selectedCard || !price) {
      setMessage('Please select a card and enter a price');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setMessage('Please enter a valid price');
      return;
    }

    onPriceUpdate(selectedCard, priceValue);
    setMessage(`Price updated for card #${selectedCard.toString().padStart(2, '0')}`);
    setPrice('');
    setSelectedCard(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-chocobo-gold">Admin Panel</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-chocobo-gold hover:text-yellow-400"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-2">
              Select Card
            </label>
            <select
              value={selectedCard || ''}
              onChange={(e) => setSelectedCard(parseInt(e.target.value) || null)}
              className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
            >
              <option value="">Choose a card...</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  #{card.id.toString().padStart(2, '0')} - {card.found ? 'Found' : 'Not Found'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-2">
              Recent Sale Price ($)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price..."
              className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
            />
          </div>

          <button
            onClick={handlePriceUpdate}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded"
          >
            Update Price
          </button>

          {message && (
            <p className="text-center text-green-400 text-sm">{message}</p>
          )}

          <p className="text-xs text-chocobo-light text-center">
            Press Ctrl + Alt + A to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
} 