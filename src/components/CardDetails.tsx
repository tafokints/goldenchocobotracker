'use client';

import React, { useState } from 'react';
import { ChocoboCard } from '../lib/types';

interface CardDetailsProps {
  card: ChocoboCard;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDetails({ card, isOpen, onClose }: CardDetailsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 w-[min(90vw,42rem)] max-h-[90vh] overflow-y-auto divide-y divide-chocobo-gold/20">
        <div className="flex justify-between items-center pb-4">
          <h2 className="text-xl font-bold text-chocobo-gold">
            Golden Chocobo #{card.id.toString().padStart(2, '0')} Details
          </h2>
          <button
            onClick={onClose}
            className="text-chocobo-gold hover:text-yellow-400 rounded px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 pt-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-chocobo-gold mb-2">Basic Information</h3>
            <div className="bg-chocobo-light bg-opacity-20 p-4 rounded">
              <p className="text-chocobo-light">
                <span className="font-bold">Status:</span> {card.found ? "Found" : "Not Found"}
              </p>
              {card.found && (
                <>
                  <p className="text-chocobo-light">
                    <span className="font-bold">Found by:</span> {card.foundBy}
                  </p>
                  <p className="text-chocobo-light">
                    <span className="font-bold">Date found:</span> {card.dateFound}
                  </p>
                  {card.link && (
                    <p className="text-chocobo-light">
                      <span className="font-bold">Source:</span> 
                      <a href={card.link} target="_blank" rel="noopener noreferrer" className="text-chocobo-gold hover:underline ml-1">
                        {card.link.toLowerCase().includes('ebay') ? 'eBay' : 'View Source'}
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Current Price */}
          {card.price && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Current Price</h3>
              <div className="bg-chocobo-light bg-opacity-20 p-4 rounded">
                <p className="text-green-400 text-xl font-bold">
                  ${card.price.toLocaleString()}
                </p>
                {card.priceDate && (
                  <p className="text-chocobo-light text-sm">Last updated: {card.priceDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Grading Information */}
          {card.grading && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Grading Information</h3>
              <div className="bg-chocobo-light bg-opacity-20 p-4 rounded">
                <p className="text-blue-400 text-lg font-bold">
                  {card.grading.service} {card.grading.grade}
                </p>
                {card.grading.dateGraded && (
                  <p className="text-chocobo-light text-sm">Graded on: {card.grading.dateGraded}</p>
                )}
              </div>
            </div>
          )}

          {/* Price History */}
          {card.priceHistory && card.priceHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Price History</h3>
              <div className="bg-chocobo-light bg-opacity-20 p-4 rounded max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {card.priceHistory.map((entry, index) => (
                    <div key={index} className="border-b border-chocobo-gold border-opacity-30 pb-2 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-green-400 font-bold">
                            ${entry.price.toLocaleString()}
                          </p>
                          <p className="text-chocobo-light text-sm">{entry.date}</p>
                        </div>
                        <div className="text-right text-xs text-chocobo-light">
                          {entry.soldBy && <p>From: {entry.soldBy}</p>}
                          {entry.soldTo && <p>To: {entry.soldTo}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {card.image && (
            <div>
              <h3 className="text-lg font-bold text-chocobo-gold mb-2">Card Image</h3>
              <div className="bg-chocobo-light bg-opacity-20 p-4 rounded">
                <img
                  src={card.image}
                  alt={`Golden Chocobo Card #${card.id.toString().padStart(2, '0')}`}
                  className="w-full max-w-md mx-auto rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 