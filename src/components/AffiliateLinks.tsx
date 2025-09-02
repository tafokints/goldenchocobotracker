import React from 'react';

const affiliateLinks = [
  {
    name: "Final Fantasy Collector's Boxes on Amazon",
    url: "https://amzn.to/4kAIv6n",
  },
  {
    name: "TCGPlayer Final Fantasy Boxes",
    url: "https://partner.tcgplayer.com/WyLbG3",
  },
  {
    name: "eBay MTG Final Fantasy Boxes",
    url: "https://ebay.us/MZ8psC",
  },
  {
    name: "Magic: The Gathering Deck Builder",
    url: "https://bit.ly/4kqjKd6",
  },
];

export default function AffiliateLinks() {
  return (
    <div className="w-full max-w-5xl mt-12">
      <h2 className="text-2xl font-bold text-center mb-4 text-chocobo-gold">Support the Site</h2>
      <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded text-sm text-center" role="alert">
        As an eBay Partner Network Affiliate, I earn from qualifying purchases. Some links on this site are affiliate links, and I may receive a commission if you make a purchase through them. This helps support the site at no extra cost to you.
      </div>
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