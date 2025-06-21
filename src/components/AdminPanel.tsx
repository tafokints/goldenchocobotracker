'use client';

import React, { useState, useEffect } from 'react';
import { ChocoboCard } from '../lib/types';

interface AdminPanelProps {
  cards: ChocoboCard[];
  onPriceUpdate: (cardId: number, price: number) => void;
  onImageUpdate: (cardId: number, imageUrl: string) => void;
}

export default function AdminPanel({ cards, onPriceUpdate, onImageUpdate }: AdminPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'price' | 'image'>('price');

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

  const handleImageUpdate = () => {
    if (!selectedCard || !imageUrl) {
      setMessage('Please select a card and enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      setMessage('Please enter a valid image URL');
      return;
    }

    onImageUpdate(selectedCard, imageUrl);
    setMessage(`Image updated for card #${selectedCard.toString().padStart(2, '0')}`);
    setImageUrl('');
    setSelectedCard(null);
  };

  const handleCardSelect = (cardId: number | null) => {
    setSelectedCard(cardId);
    setMessage('');
    // Pre-fill current values if they exist
    if (cardId) {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        if (activeTab === 'price' && card.price) {
          setPrice(card.price.toString());
        }
        if (activeTab === 'image' && card.image) {
          setImageUrl(card.image);
        }
      }
    }
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
              onChange={(e) => handleCardSelect(parseInt(e.target.value) || null)}
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

          {/* Tab Navigation */}
          <div className="flex border-b border-chocobo-gold">
            <button
              onClick={() => setActiveTab('price')}
              className={`px-4 py-2 text-sm font-bold ${
                activeTab === 'price' 
                  ? 'text-chocobo-gold border-b-2 border-chocobo-gold' 
                  : 'text-chocobo-light hover:text-chocobo-gold'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-4 py-2 text-sm font-bold ${
                activeTab === 'image' 
                  ? 'text-chocobo-gold border-b-2 border-chocobo-gold' 
                  : 'text-chocobo-light hover:text-chocobo-gold'
              }`}
            >
              Image
            </button>
          </div>

          {/* Price Tab */}
          {activeTab === 'price' && (
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
              <button
                onClick={handlePriceUpdate}
                className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded mt-2"
              >
                Update Price
              </button>
            </div>
          )}

          {/* Image Tab */}
          {activeTab === 'image' && (
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
              />
              <button
                onClick={handleImageUpdate}
                className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded mt-2"
              >
                Update Image
              </button>
            </div>
          )}

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