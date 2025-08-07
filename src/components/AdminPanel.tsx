'use client';

import React, { useState, useEffect } from 'react';
import { ChocoboCard, GradingInfo, PriceHistoryEntry } from '../lib/types';

interface AdminPanelProps {
  cards: ChocoboCard[];
  onPriceUpdate: (cardId: number, price: number) => void;
  onImageUpdate: (cardId: number, imageUrl: string) => void;
  onGradingUpdate: (cardId: number, grading: GradingInfo) => void;
  onPriceHistoryAdd: (cardId: number, entry: PriceHistoryEntry) => void;
}

export default function AdminPanel({ 
  cards, 
  onPriceUpdate, 
  onImageUpdate, 
  onGradingUpdate, 
  onPriceHistoryAdd 
}: AdminPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'price' | 'image' | 'grading' | 'history'>('price');
  
  // Grading fields
  const [gradingService, setGradingService] = useState('');
  const [grade, setGrade] = useState('');
  const [dateGraded, setDateGraded] = useState('');
  
  // Price history fields
  const [historyPrice, setHistoryPrice] = useState('');
  const [soldBy, setSoldBy] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [saleDate, setSaleDate] = useState('');

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

    // Accept absolute URLs and relative URLs starting with '/' (v2)
    const isValidUrl = (() => {
      if (imageUrl.startsWith('/')) return true;
      try {
        new URL(imageUrl);
        return true;
      } catch {
        return false;
      }
    })();
    if (!isValidUrl) {
      setMessage('Please enter a valid image URL');
      return;
    }

    onImageUpdate(selectedCard, imageUrl);
    setMessage(`Image updated for card #${selectedCard.toString().padStart(2, '0')}`);
    setImageUrl('');
    setSelectedCard(null);
  };

  const handleGradingUpdate = () => {
    if (!selectedCard || !gradingService || !grade) {
      setMessage('Please select a card and enter grading service and grade');
      return;
    }

    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0) {
      setMessage('Please enter a valid grade');
      return;
    }

    const gradingInfo: GradingInfo = {
      service: gradingService,
      grade: gradeValue,
      dateGraded: dateGraded || new Date().toISOString().split('T')[0]
    };

    onGradingUpdate(selectedCard, gradingInfo);
    setMessage(`Grading updated for card #${selectedCard.toString().padStart(2, '0')}`);
    setGradingService('');
    setGrade('');
    setDateGraded('');
    setSelectedCard(null);
  };

  const handlePriceHistoryAdd = () => {
    if (!selectedCard || !historyPrice || !saleDate) {
      setMessage('Please select a card and enter price and sale date');
      return;
    }

    const priceValue = parseFloat(historyPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      setMessage('Please enter a valid price');
      return;
    }

    const historyEntry: PriceHistoryEntry = {
      price: priceValue,
      date: saleDate,
      soldBy: soldBy || undefined,
      soldTo: soldTo || undefined
    };

    onPriceHistoryAdd(selectedCard, historyEntry);
    setMessage(`Price history added for card #${selectedCard.toString().padStart(2, '0')}`);
    setHistoryPrice('');
    setSoldBy('');
    setSoldTo('');
    setSaleDate('');
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
        if (activeTab === 'grading' && card.grading) {
          setGradingService(card.grading.service);
          setGrade(card.grading.grade.toString());
          setDateGraded(card.grading.dateGraded || '');
        }
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
          <div className="flex border-b border-chocobo-gold flex-wrap">
            <button
              onClick={() => setActiveTab('price')}
              className={`px-2 py-2 text-xs font-bold ${
                activeTab === 'price' 
                  ? 'text-chocobo-gold border-b-2 border-chocobo-gold' 
                  : 'text-chocobo-light hover:text-chocobo-gold'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-2 py-2 text-xs font-bold ${
                activeTab === 'image' 
                  ? 'text-chocobo-gold border-b-2 border-chocobo-gold' 
                  : 'text-chocobo-light hover:text-chocobo-gold'
              }`}
            >
              Image
            </button>
            <button
              onClick={() => setActiveTab('grading')}
              className={`px-2 py-2 text-xs font-bold ${
                activeTab === 'grading' 
                  ? 'text-chocobo-gold border-b-2 border-chocobo-gold' 
                  : 'text-chocobo-light hover:text-chocobo-gold'
              }`}
            >
              Grading
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2 py-2 text-xs font-bold ${
                activeTab === 'history' 
                  ? 'text-chocobo-gold border-b-2 border-chocobo-gold' 
                  : 'text-chocobo-light hover:text-chocobo-gold'
              }`}
            >
              History
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

          {/* Grading Tab */}
          {activeTab === 'grading' && (
            <div className="space-y-3">
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Grading Service
                </label>
                <input
                  type="text"
                  value={gradingService}
                  onChange={(e) => setGradingService(e.target.value)}
                  placeholder="e.g., PSA, BGS, CGC"
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Grade
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., 9.5"
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Date Graded (optional)
                </label>
                <input
                  type="date"
                  value={dateGraded}
                  onChange={(e) => setDateGraded(e.target.value)}
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <button
                onClick={handleGradingUpdate}
                className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded"
              >
                Update Grading
              </button>
            </div>
          )}

          {/* Price History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Sale Price ($)
                </label>
                <input
                  type="number"
                  value={historyPrice}
                  onChange={(e) => setHistoryPrice(e.target.value)}
                  placeholder="Enter sale price..."
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Sold By (optional)
                </label>
                <input
                  type="text"
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  placeholder="Previous owner"
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-chocobo-gold text-sm font-bold mb-2">
                  Sold To (optional)
                </label>
                <input
                  type="text"
                  value={soldTo}
                  onChange={(e) => setSoldTo(e.target.value)}
                  placeholder="New owner"
                  className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3"
                />
              </div>
              <button
                onClick={handlePriceHistoryAdd}
                className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded"
              >
                Add to Price History
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