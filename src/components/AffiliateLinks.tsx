import React from 'react';

const affiliateLinks = [
  {
    name: "Final Fantasy Collector's Boxes on Amazon",
    url: "https://amzn.to/4kAIv6n",
  },
  {
    name: "MTG Booster Boxes",
    url: "https://amzn.to/4kAIv6n",
  },
  {
    name: "eBay MTG Final Fantasy Boxes",
    url: "https://ebay.us/MZ8psC",
  },
];

export default function AffiliateLinks() {
  return (
    <div className="w-full max-w-5xl mt-12">
      <h2 className="text-2xl font-bold text-center mb-4 text-chocobo-gold">Support the Site</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {affiliateLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-chocobo-dark border border-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-bold py-2 px-4 rounded text-center transition-colors"
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
} 