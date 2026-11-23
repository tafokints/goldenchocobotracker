'use client';

import React, { useState } from 'react';
import { COMMON_GRADE_LABELS, formatGradingDisplay } from '@/lib/grading';
import type { ResolvedCard } from '@/lib/types';

const DARK_INPUT_CLASS =
  'w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2 px-3';

interface AdminDashboardProps {
  initialCards: ResolvedCard[];
  adminLabel: string;
}

type AdminTab = 'find' | 'price' | 'image' | 'grading' | 'history';

export default function AdminDashboard({ initialCards, adminLabel }: AdminDashboardProps) {
  const [cards, setCards] = useState<ResolvedCard[]>(initialCards);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('find');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Find / Pull fields
  const [foundBy, setFoundBy] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [pullChannel, setPullChannel] = useState('');
  const [region, setRegion] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [marketplaceUrl, setMarketplaceUrl] = useState('');
  const [marketplaceLabel, setMarketplaceLabel] = useState('');

  // Price fields
  const [price, setPrice] = useState('');
  const [priceDate, setPriceDate] = useState('');

  // Image field
  const [imageUrl, setImageUrl] = useState('');

  // Grading fields
  const [gradingService, setGradingService] = useState('');
  const [grade, setGrade] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [dateGraded, setDateGraded] = useState('');
  const [certNumber, setCertNumber] = useState('');

  // Price history fields
  const [historyPrice, setHistoryPrice] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [soldBy, setSoldBy] = useState('');
  const [soldTo, setSoldTo] = useState('');

  const refreshCards = async () => {
    const res = await fetch('/api/cards?fresh=1', { cache: 'no-store' });
    if (res.ok) {
      const updated: ResolvedCard[] = await res.json();
      setCards(updated);
    }
  };

  const handleCardSelect = (cardId: number | null) => {
    setSelectedCard(cardId);
    setStatusMessage(null);
    if (!cardId) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    setFoundBy(card.foundBy || '');
    setDateFound(card.dateFound || '');
    setPullChannel(card.pullChannel || '');
    setRegion(card.region || '');
    setSourceUrl(card.sourceUrl || '');
    setMarketplaceUrl(card.marketplaceUrl || '');
    setMarketplaceLabel(card.marketplaceLabel || '');
    setPrice(card.price !== undefined ? card.price.toString() : '');
    setPriceDate(card.priceDate || '');
    setImageUrl(card.image || card.resolvedImage || '');
    setGradingService(card.grading?.service || '');
    setGrade(card.grading?.grade !== undefined ? card.grading.grade.toString() : '');
    setGradeLabel(card.grading?.gradeLabel || '');
    setDateGraded(card.grading?.dateGraded || '');
    setCertNumber(card.grading?.certNumber || '');
  };

  const postAction = async (endpoint: string, payload: Record<string, unknown>, successText: string) => {
    if (!selectedCard) {
      setStatusMessage({ text: 'Please select a card first.', isError: true });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatusMessage({
          text: data.error || data.message || `Request failed (${response.status})`,
          isError: true,
        });
        return;
      }

      await refreshCards();
      setStatusMessage({ text: successText, isError: false });
    } catch {
      setStatusMessage({ text: 'Network error while saving update.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const paddedSelected = selectedCard ? selectedCard.toString().padStart(2, '0') : '';

  return (
    <div className="w-full max-w-2xl bg-chocobo-surface border border-chocobo-gold/30 rounded-lg p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-chocobo-gold/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-chocobo-gold">Card Management</h2>
          <p className="text-xs text-chocobo-muted">Signed in as {adminLabel}</p>
        </div>
        <span className="text-xs text-chocobo-gold/90 tabular-nums">
          {cards.filter((c) => c.found).length} / {cards.length} Found
        </span>
      </div>

      <div>
        <label htmlFor="admin-card-select" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Select Card
        </label>
        <select
          id="admin-card-select"
          value={selectedCard ?? ''}
          onChange={(e) => handleCardSelect(parseInt(e.target.value, 10) || null)}
          className="w-full bg-chocobo-recessed text-chocobo-light border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
        >
          <option value="">Choose a card...</option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              #{card.id.toString().padStart(2, '0')} — {card.found ? `Found (${card.foundBy || 'Unknown'})` : 'Not Found'}
            </option>
          ))}
        </select>
      </div>

      <div className="flex border-b border-chocobo-gold/50 flex-wrap gap-1" role="tablist">
        {(
          [
            ['find', 'Discovery / Links'],
            ['price', 'Price'],
            ['image', 'Image'],
            ['grading', 'Grading'],
            ['history', 'Price History'],
          ] as Array<[AdminTab, string]>
        ).map(([tabKey, label]) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={activeTab === tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === tabKey
                ? 'text-chocobo-gold border-b-2 border-chocobo-gold'
                : 'text-chocobo-light/80 hover:text-chocobo-gold'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'find' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postAction(
              '/api/submit',
              {
                cardId: selectedCard,
                foundBy,
                dateFound,
                pullChannel: pullChannel || undefined,
                region: region || undefined,
                sourceUrl,
                marketplaceUrl,
                marketplaceLabel: marketplaceLabel || undefined,
              },
              `Discovery details saved for #${paddedSelected}.`
            );
          }}
        >
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-1">Found By</label>
            <input
              type="text"
              required
              value={foundBy}
              onChange={(e) => setFoundBy(e.target.value)}
              placeholder="Collector or shop handle"
              className={DARK_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-1">Date Found</label>
            <input
              type="date"
              required
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              className={DARK_INPUT_CLASS}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Pull Channel (optional)
              </label>
              <select
                value={pullChannel}
                onChange={(e) => setPullChannel(e.target.value)}
                className={DARK_INPUT_CLASS}
              >
                <option value="">Unspecified</option>
                <option value="lgs">Local Game Store (LGS)</option>
                <option value="personal_box">Personal Collector Box</option>
                <option value="breaker">Live Breaker / Whatnot</option>
                <option value="retail">Big Box Retail</option>
                <option value="gift_bundle">Gift / Collector Bundle</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Region / Country (optional)
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., US, Japan, Canada, Europe"
                className={DARK_INPUT_CLASS}
              />
            </div>
          </div>
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-1">
              Pull Source URL (Non-Affiliate Proof: Instagram, Reddit, X)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className={DARK_INPUT_CLASS}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Marketplace / eBay Listing URL (Optional)
              </label>
              <input
                type="url"
                value={marketplaceUrl}
                onChange={(e) => setMarketplaceUrl(e.target.value)}
                placeholder="https://www.ebay.com/itm/..."
                className={DARK_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">Label</label>
              <input
                type="text"
                value={marketplaceLabel}
                onChange={(e) => setMarketplaceLabel(e.target.value)}
                placeholder="eBay"
                className={DARK_INPUT_CLASS}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-2.5 px-4 rounded"
          >
            {submitting ? 'Saving...' : 'Save Discovery Details'}
          </button>
        </form>
      )}

      {activeTab === 'price' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postAction(
              '/api/update-price',
              {
                cardId: selectedCard,
                price: parseFloat(price),
                date: priceDate || undefined,
              },
              `Price updated for #${paddedSelected}.`
            );
          }}
        >
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-1">
              Recent Sale Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50000"
              className={DARK_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-1">
              Sale Date (optional — defaults to today)
            </label>
            <input
              type="date"
              value={priceDate}
              onChange={(e) => setPriceDate(e.target.value)}
              className={DARK_INPUT_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-2.5 px-4 rounded"
          >
            {submitting ? 'Saving...' : 'Update Price'}
          </button>
        </form>
      )}

      {activeTab === 'image' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postAction(
              '/api/update-image',
              { cardId: selectedCard, imageUrl },
              `Image updated for #${paddedSelected}.`
            );
          }}
        >
          <div>
            <label className="block text-chocobo-gold text-sm font-bold mb-1">
              Image Path or HTTPS URL
            </label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/chocobo-01.jpg or https://..."
              className={DARK_INPUT_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-2.5 px-4 rounded"
          >
            {submitting ? 'Saving...' : 'Update Image'}
          </button>
        </form>
      )}

      {activeTab === 'grading' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postAction(
              '/api/update-grading',
              {
                cardId: selectedCard,
                grading: {
                  service: gradingService,
                  grade: parseFloat(grade),
                  gradeLabel: gradeLabel || undefined,
                  dateGraded: dateGraded || undefined,
                  certNumber: certNumber || undefined,
                },
              },
              `Grading updated for #${paddedSelected}.`
            );
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Grading Service
              </label>
              <input
                type="text"
                required
                value={gradingService}
                onChange={(e) => setGradingService(e.target.value)}
                placeholder="PSA, BGS, CGC"
                className={DARK_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">Grade</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="10"
                className={DARK_INPUT_CLASS}
              />
            </div>
          </div>
          <div>
            <label htmlFor="admin-grade-label" className="block text-chocobo-gold text-sm font-bold mb-1">
              Slab Tier / Designation (optional)
            </label>
            <input
              id="admin-grade-label"
              type="text"
              list="admin-common-grade-labels"
              maxLength={60}
              value={gradeLabel}
              onChange={(e) => setGradeLabel(e.target.value)}
              placeholder="e.g., Pristine 10, Black Label 10, Gem Mint 10, MBA Gold Diamond"
              className={DARK_INPUT_CLASS}
            />
            <datalist id="admin-common-grade-labels">
              {COMMON_GRADE_LABELS.map((tier) => (
                <option key={tier} value={tier} />
              ))}
            </datalist>
            {gradingService && grade !== '' && !Number.isNaN(parseFloat(grade)) && (
              <p className="text-xs text-chocobo-muted mt-1.5">
                Display preview:{' '}
                <span className="text-chocobo-gold font-semibold">
                  {formatGradingDisplay({
                    service: gradingService,
                    grade: parseFloat(grade),
                    gradeLabel: gradeLabel || undefined,
                  })}
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Cert Number (optional)
              </label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="e.g., 104829104"
                className={DARK_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Date Graded (optional)
              </label>
              <input
                type="date"
                value={dateGraded}
                onChange={(e) => setDateGraded(e.target.value)}
                className={DARK_INPUT_CLASS}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-2.5 px-4 rounded"
          >
            {submitting ? 'Saving...' : 'Update Grading'}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            postAction(
              '/api/add-price-history',
              {
                cardId: selectedCard,
                entry: {
                  price: parseFloat(historyPrice),
                  date: saleDate,
                  soldBy: soldBy || undefined,
                  soldTo: soldTo || undefined,
                },
              },
              `Price history added for #${paddedSelected}.`
            );
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Sale Price ($)
              </label>
              <input
                type="number"
                min="0"
                required
                value={historyPrice}
                onChange={(e) => setHistoryPrice(e.target.value)}
                placeholder="75000"
                className={DARK_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">Sale Date</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className={DARK_INPUT_CLASS}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Sold By (optional)
              </label>
              <input
                type="text"
                value={soldBy}
                onChange={(e) => setSoldBy(e.target.value)}
                placeholder="Previous owner"
                className={DARK_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-chocobo-gold text-sm font-bold mb-1">
                Sold To (optional)
              </label>
              <input
                type="text"
                value={soldTo}
                onChange={(e) => setSoldTo(e.target.value)}
                placeholder="New owner"
                className={DARK_INPUT_CLASS}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-2.5 px-4 rounded"
          >
            {submitting ? 'Saving...' : 'Add Price History Entry'}
          </button>
        </form>
      )}

      {statusMessage && (
        <p
          role="status"
          className={`text-sm text-center font-semibold ${
            statusMessage.isError ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {statusMessage.text}
        </p>
      )}
    </div>
  );
}
